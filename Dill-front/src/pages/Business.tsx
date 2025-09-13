import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowLeft, ArrowRight, FileSpreadsheet, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Business() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    "Upload Data",
    "Analysis Options", 
    "Chart Generation",
    "Narrative Builder",
    "Export Slides"
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Upload Your Data</h2>
              <p className="text-muted-foreground">
                Upload financial reports, spreadsheets, or other business data
              </p>
            </div>
            
            <div className="upload-zone rounded-lg p-12 text-center border-2 border-dashed">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your files here</p>
                <p className="text-sm text-muted-foreground">Supports XLSX, CSV, PDF reports</p>
              </div>
              <Button variant="outline" className="mt-4">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Analysis Options</h2>
              <p className="text-muted-foreground">
                How would you like to analyze your data?
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Auto-detect Patterns</h3>
                      <p className="text-sm text-muted-foreground">Let AI find trends, outliers, and insights automatically</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Search Specific Trends</h3>
                      <p className="text-sm text-muted-foreground mb-2">Look for specific patterns or metrics</p>
                      <input 
                        className="w-full p-2 border rounded-md text-sm" 
                        placeholder="e.g., quarterly revenue growth, cost reduction patterns..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Generated Charts & Insights</h2>
              <p className="text-muted-foreground">
                Review the analysis and select charts for your presentation
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Revenue Growth", type: "Line Chart", insight: "25% increase in Q4" },
                { title: "Cost Breakdown", type: "Pie Chart", insight: "Operations: 45% of total costs" },
                { title: "Market Share", type: "Bar Chart", insight: "Leading in 3 key segments" },
                { title: "Profit Margins", type: "Area Chart", insight: "Margins improving 2% quarterly" }
              ].map((chart, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-subtle rounded-md mb-3 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{chart.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{chart.type}</p>
                    <p className="text-xs text-primary font-medium">{chart.insight}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-xs">Include in presentation</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Build Your Narrative</h2>
              <p className="text-muted-foreground">
                Craft the story you want to tell with your data
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Presentation Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Main message or theme</label>
                  <input 
                    className="w-full p-3 border rounded-md" 
                    placeholder="e.g., Strong Q4 performance drives optimistic 2024 outlook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Key takeaways</label>
                  <textarea 
                    className="w-full p-3 border rounded-md h-24" 
                    placeholder="What are the 3-5 most important points your audience should remember?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Call to action</label>
                  <input 
                    className="w-full p-3 border rounded-md" 
                    placeholder="What should the audience do next?"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Your Business Presentation is Ready!</h2>
              <p className="text-muted-foreground">
                Review your data-driven slides and export when ready
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Executive Summary",
                "Revenue Growth",
                "Cost Analysis", 
                "Market Position",
                "Future Outlook",
                "Action Items"
              ].map((slide, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-subtle rounded-md mb-2 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">{slide}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Click to edit</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline">
                Export as PDF
              </Button>
              <Button variant="hero">
                Export as PPTX
              </Button>
              <Button variant="ghost-primary">
                Share Link
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={step}
                  className={`text-sm ${
                    index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step Content */}
          <Card className="card-elegant">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button 
              variant="hero"
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === totalSteps}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}