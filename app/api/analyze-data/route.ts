import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import formidable from "formidable";
import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { Anthropic } from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});


interface DatasetMetadata {
  columns: string[];
  rowCount: number;
  columnTypes: Record<string, string>;
  missingValues: Record<string, number>;
  duplicateRows: number;
  sampleRows: any[];
}

interface CleaningNote {
  issue: string;
  resolution: string;
  justification: string;
  transformation: string;
}

interface ValidationItem {
  field: string;
  status: "valid" | "warning" | "error";
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

function analyzeDataset(data: any[]): DatasetMetadata {
  if (!data || data.length === 0) {
    return {
      columns: [],
      rowCount: 0,
      columnTypes: {},
      missingValues: {},
      duplicateRows: 0,
      sampleRows: []
    };
  }

  const columns = Object.keys(data[0] || {});
  const rowCount = data.length;
  const columnTypes: Record<string, string> = {};
  const missingValues: Record<string, number> = {};

  // Analyze each column
  columns.forEach(col => {
    let numericCount = 0;
    let dateCount = 0;
    let missingCount = 0;

    data.forEach(row => {
      const value = row[col];
      if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'null') {
        missingCount++;
      } else if (!isNaN(Number(value)) && value !== '') {
        numericCount++;
      } else if (!isNaN(Date.parse(value))) {
        dateCount++;
      }
    });

    missingValues[col] = missingCount;

    // Determine column type
    const validCount = rowCount - missingCount;
    if (numericCount > validCount * 0.7) {
      columnTypes[col] = 'numeric';
    } else if (dateCount > validCount * 0.7) {
      columnTypes[col] = 'date';
    } else {
      columnTypes[col] = 'text';
    }
  });

  // Count duplicate rows
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  const duplicateRows = rowCount - uniqueRows.size;

  return {
    columns,
    rowCount,
    columnTypes,
    missingValues,
    duplicateRows,
    sampleRows: data.slice(0, 20)
  };
}

async function analyzeWithClaude(metadata: DatasetMetadata): Promise<AnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not configured");
    return getFallbackAnalysis(metadata);
  }

  const prompt = `You are a data-cleaning and analysis agent. 
You must handle messy, real-world datasets with missing, conflicting, and noisy values. 
You will infer, validate, and resolve issues as an expert analyst.

IMPORTANT: For reproducibility, you must specify EXACT data transformations that can be programmatically applied.

Dataset sample (first 20 rows):
${JSON.stringify(metadata.sampleRows, null, 2)}

Metadata:
- Columns: ${metadata.columns.join(', ')}
- Total rows: ${metadata.rowCount}
- Column types: ${JSON.stringify(metadata.columnTypes, null, 2)}
- Missing values per column: ${JSON.stringify(metadata.missingValues, null, 2)}
- Duplicate rows: ${metadata.duplicateRows}

Tasks:
1. Identify missing, inconsistent, or duplicate values.
2. Suggest AND justify cleaning strategies with SPECIFIC transformations (e.g., "Fill missing Age values with median=32.5", "Convert 'N/A' strings to null in column X").
3. Perform data validation: detect invalid formats, out-of-range values, or conflicting sources.
4. For each transformation, provide the exact operation and parameters.
5. Provide 2–3 quick insights or anomalies in the dataset.
6. Suggest 1–2 useful plots (with chart type and axes).

Return your answer as JSON with keys:
{
  "cleaning_notes": [ { 
    "issue": "...", 
    "resolution": "...", 
    "justification": "...",
    "transformation": "EXACT operation to perform (e.g., 'fillna(median)', 'replace(N/A, null)', 'drop_duplicates()')"
  } ],
  "validation_report": [ { "field": "...", "status": "valid|warning|error", "message": "...", "count": 0 } ],
  "insights": [ "..." ],
  "plots": [ { "type": "bar|line|scatter|histogram", "x_axis": "...", "y_axis": "...", "description": "..." } ]
}`;

  try {
    console.log("Calling Claude API...");
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log("Claude API response received");
    const content = response.content[0];
    if (content.type === "text") {
      console.log("Claude response text:", content.text.substring(0, 500) + "...");
      
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed Claude response");
        return parsed;
      } else {
        console.error("No JSON found in Claude response");
      }
    }

    throw new Error("Failed to parse Claude response");
  } catch (error: any) {
    console.error("Claude analysis error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    return getFallbackAnalysis(metadata);
  }
}

function getFallbackAnalysis(metadata: DatasetMetadata): AnalysisResult {
  const cleaningNotes: CleaningNote[] = [];
  const validationReport: ValidationItem[] = [];
  
  // Generate basic analysis based on metadata
  Object.entries(metadata.missingValues).forEach(([column, count]) => {
    if (count > 0) {
      const percentage = ((count / metadata.rowCount) * 100).toFixed(1);
      cleaningNotes.push({
        issue: `Missing values in column '${column}'`,
        resolution: `Found ${count} missing values (${percentage}%)`,
        justification: `Consider imputation strategy based on data type: ${metadata.columnTypes[column]}`,
        transformation: metadata.columnTypes[column] === 'numeric' ? 
          `fillna(${column}.median())` : 
          `fillna(${column}.mode()[0])`
      });
      
      validationReport.push({
        field: column,
        status: count > metadata.rowCount * 0.1 ? 'warning' : 'valid',
        message: `${count} missing values (${percentage}%)`,
        count
      });
    }
  });
  
  if (metadata.duplicateRows > 0) {
    cleaningNotes.push({
      issue: `Duplicate rows detected`,
      resolution: `Found ${metadata.duplicateRows} duplicate rows`,
      justification: `Duplicates can skew analysis results`,
      transformation: `drop_duplicates(keep='first')`
    });
  }
  
  const insights = [
    `Dataset contains ${metadata.rowCount} rows and ${metadata.columns.length} columns`,
    `Data types: ${Object.values(metadata.columnTypes).reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})}`,
    metadata.duplicateRows > 0 ? `${metadata.duplicateRows} duplicate rows need attention` : 'No duplicate rows detected'
  ].filter(Boolean);
  
  // Generate intelligent plot suggestions based on data types
  const plots: PlotSuggestion[] = [];
  
  // Find numeric columns for histograms
  const numericColumns = Object.entries(metadata.columnTypes)
    .filter(([_, type]) => type === 'numeric')
    .map(([col, _]) => col);
  
  // Find categorical columns for frequency charts
  const categoricalColumns = Object.entries(metadata.columnTypes)
    .filter(([_, type]) => type === 'text')
    .map(([col, _]) => col);
  
  // Add histogram for first numeric column
  if (numericColumns.length > 0) {
    plots.push({
      type: "histogram",
      x_axis: numericColumns[0],
      description: `Distribution of ${numericColumns[0]} values`
    });
  }
  
  // Add frequency chart for first categorical column
  if (categoricalColumns.length > 0) {
    plots.push({
      type: "bar",
      x_axis: categoricalColumns[0],
      description: `Frequency distribution of ${categoricalColumns[0]} categories`
    });
  }
  
  // If we have both numeric and categorical, suggest a comparison
  if (numericColumns.length > 1) {
    plots.push({
      type: "line",
      x_axis: numericColumns[1],
      description: `Trend analysis of ${numericColumns[1]} over data points`
    });
  }
  
  // Fallback if no good columns found
  if (plots.length === 0 && metadata.columns.length > 0) {
    plots.push({
      type: "bar",
      x_axis: metadata.columns[0],
      description: `Distribution of ${metadata.columns[0]}`
    });
  }

  return {
    cleaning_notes: cleaningNotes,
    validation_report: validationReport,
    insights,
    plots: plots.slice(0, 2)
  };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
    }

    const datasets: any[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      if (!file.name.match(/\.(csv|xlsx?)$/i)) {
        return NextResponse.json({ 
          ok: false, 
          error: `Unsupported file type: ${file.name}. Only CSV and Excel files are supported.` 
        }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const content = buffer.toString('utf-8');

      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV parsing warnings:", parseResult.errors);
      }

      datasets.push(parseResult.data);
      fileNames.push(file.name);
    }

    let combinedData = datasets[0];
    if (datasets.length > 1) {
      combinedData = datasets.flat();
    }

    const metadata = analyzeDataset(combinedData);
    const analysis = await analyzeWithClaude(metadata);
    let storagePath: string | null = null;

    return NextResponse.json({
      ok: true,
      metadata,
      analysis,
      storagePath,
      dataPreview: combinedData.slice(0, 10)
    });

  } catch (error: any) {
    console.error("Data analysis error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message ?? "Unknown server error" 
    }, { status: 500 });
  }
}