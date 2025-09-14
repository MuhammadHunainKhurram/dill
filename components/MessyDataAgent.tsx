'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface CleaningNote {
  issue: string;
  resolution: string;
  justification: string;
  transformation: string;
}

interface ValidationItem {
  field: string;
  status: 'valid' | 'warning' | 'error';
  message: string;
  count?: number;
}

interface PlotSuggestion {
  type: string;
  x_axis: string;
  y_axis?: string;
  description: string;
}

interface AnalysisResult {
  cleaning_notes: CleaningNote[];
  validation_report: ValidationItem[];
  insights: string[];
  plots: PlotSuggestion[];
}

interface DatasetMetadata {
  columns: string[];
  rowCount: number;
  columnTypes: Record<string, string>;
  missingValues: Record<string, number>;
  duplicateRows: number;
  sampleRows: any[];
}

interface AnalysisResponse {
  ok: boolean;
  metadata: DatasetMetadata;
  analysis: AnalysisResult;
  dataPreview: any[];
  storagePath?: string;
  error?: string;
}

export default function MessyDataAgent() {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFiles = acceptedFiles.filter(file => 
      file.name.match(/\.(csv|xlsx?)$/i)
    );
    
    if (csvFiles.length !== acceptedFiles.length) {
      setError('Only CSV and Excel files are supported');
      return;
    }
    
    setFiles(csvFiles);
    setError(null);
    setResults(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const analyzeData = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/analyze-data', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      const data: AnalysisResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze data');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadCleanedData = () => {
    if (!results?.dataPreview) return;

    const csv = convertToCSV(results.dataPreview);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const renderChart = (plot: PlotSuggestion, data: any[]) => {
    if (!data.length) return null;

    // Get the column data for the chart
    const columnData = data.map(row => row[plot.x_axis]).filter(val => val !== null && val !== undefined && val !== '');
    
    if (columnData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">No data available for column: {plot.x_axis}</p>
        </div>
      );
    }

    // Check if data is numeric
    const isNumeric = columnData.every(val => !isNaN(Number(val)));
    
    let chartData;
    let options;

    if (isNumeric) {
      // For numeric data, create a histogram or line chart
      const numericData = columnData.map(val => Number(val));
      
      if (plot.type.toLowerCase() === 'histogram' || plot.type.toLowerCase() === 'bar') {
        // Create histogram bins
        const min = Math.min(...numericData);
        const max = Math.max(...numericData);
        const binCount = Math.min(10, Math.ceil(Math.sqrt(numericData.length)));
        const binSize = (max - min) / binCount;
        
        const bins = Array(binCount).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < binCount; i++) {
          const binStart = min + i * binSize;
          const binEnd = min + (i + 1) * binSize;
          binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
        }
        
        numericData.forEach(val => {
          const binIndex = Math.min(Math.floor((val - min) / binSize), binCount - 1);
          bins[binIndex]++;
        });
        
        chartData = {
          labels: binLabels,
          datasets: [{
            label: `${plot.x_axis} Distribution`,
            data: bins,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }]
        };
      } else {
        // Line chart for numeric data over index
        chartData = {
          labels: numericData.map((_, index) => String(index + 1)),
          datasets: [{
            label: plot.x_axis,
            data: numericData,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            ...(plot.type.toLowerCase() === 'line' ? { fill: false } : {}),
          }]
        };
      }
    } else {
      // For categorical data, create frequency chart
      const frequency: Record<string, number> = {};
      columnData.forEach(val => {
        const key = String(val);
        frequency[key] = (frequency[key] || 0) + 1;
      });
      
      const sortedEntries = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10 categories
      
      chartData = {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
          label: `${plot.x_axis} Frequency`,
          data: sortedEntries.map(([,count]) => count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(245, 101, 101, 0.5)',
            'rgba(251, 191, 36, 0.5)',
            'rgba(139, 92, 246, 0.5)',
            'rgba(236, 72, 153, 0.5)',
            'rgba(6, 182, 212, 0.5)',
            'rgba(34, 197, 94, 0.5)',
            'rgba(239, 68, 68, 0.5)',
            'rgba(168, 85, 247, 0.5)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 101, 101, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(168, 85, 247, 1)',
          ],
          borderWidth: 1,
        }]
      };
    }

    options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: plot.description,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    switch (plot.type.toLowerCase()) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'scatter':
        return <Scatter data={chartData} options={options} />;
      case 'histogram':
      case 'bar':
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-gray-700">
          Dashboard
        </Link>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-gray-900 font-medium">Data Agent</span>
      </nav>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messy Data Agent</h1>
        <p className="text-gray-600">Upload messy CSV/Excel files and let AI clean and analyze your data</p>
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drag & drop CSV/Excel files'}
            </div>
            <p className="text-gray-500">or click to select files</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Selected Files:</h3>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
            <button
              onClick={analyzeData}
              disabled={isAnalyzing}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Data'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Dataset Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dataset Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.metadata.rowCount}</div>
                <div className="text-sm text-gray-500">Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.metadata.columns.length}</div>
                <div className="text-sm text-gray-500">Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{results.metadata.duplicateRows}</div>
                <div className="text-sm text-gray-500">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(results.metadata.missingValues).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-500">Missing Values</div>
              </div>
            </div>
          </div>

          {/* Cleaning Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Cleaning Analysis</h2>
            <div className="space-y-4">
              {results.analysis.cleaning_notes.map((note, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{note.issue}</h3>
                  <p className="text-sm text-gray-600 mt-1"><strong>Resolution:</strong> {note.resolution}</p>
                  <p className="text-sm text-gray-500 mt-1"><strong>Justification:</strong> {note.justification}</p>
                  {note.transformation && (
                    <div className="mt-2 bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-700"><strong>Transformation:</strong></p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-blue-600">
                        {note.transformation}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Report */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Validation Report</h2>
            <div className="space-y-2">
              {results.analysis.validation_report.map((item, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg ${
                  item.status === 'valid' ? 'bg-green-50 text-green-800' :
                  item.status === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-red-50 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    item.status === 'valid' ? 'bg-green-500' :
                    item.status === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <span className="font-medium">{item.field}:</span> {item.message}
                    {item.count && <span className="ml-2 text-sm">({item.count} items)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
            <ul className="space-y-2">
              {results.analysis.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Charts */}
          {results.analysis.plots.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Visualizations</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.analysis.plots.map((plot, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{plot.description}</h3>
                    <div className="h-64">
                      {renderChart(plot, results.dataPreview)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Results</h2>
            <div className="flex space-x-4">
              <button
                onClick={downloadCleanedData}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Cleaned Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
