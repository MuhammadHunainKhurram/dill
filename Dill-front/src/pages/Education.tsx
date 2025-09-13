import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowLeft, ArrowRight, FileText, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Education() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    "Upload PDF",
    "Choose Template", 
    "AI Generation",
    "Edit & Export"
  ];

  const presentationTemplates = [
    {
      id: "modern-minimal",
      name: "Modern Minimal",
      description: "Clean lines, lots of white space, perfect for tech presentations",
      preview: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-light)) 100%)",
      style: "Geometric shapes, sans-serif fonts, high contrast"
    },
    {
      id: "academic-classic",
      name: "Academic Classic",
      description: "Traditional, professional look ideal for research and education",
      preview: "linear-gradient(135deg, hsl(220 13% 91%) 0%, hsl(220 13% 69%) 100%)",
      style: "Serif fonts, structured layouts, formal color palette"
    },
    {
      id: "creative-bold",
      name: "Creative Bold",
      description: "Vibrant colors and dynamic layouts for creative presentations",
      preview: "linear-gradient(135deg, hsl(280 100% 70%) 0%, hsl(320 100% 80%) 100%)",
      style: "Bold typography, colorful accents, asymmetrical layouts"
    },
    {
      id: "corporate-professional",
      name: "Corporate Professional",
      description: "Polished business look with subtle branding elements",
      preview: "linear-gradient(135deg, hsl(210 100% 20%) 0%, hsl(210 100% 40%) 100%)",
      style: "Conservative colors, clean layouts, professional imagery"
    },
    {
      id: "nature-organic",
      name: "Nature Organic",
      description: "Earth tones and natural elements for environmental topics",
      preview: "linear-gradient(135deg, hsl(120 60% 30%) 0%, hsl(80 40% 50%) 100%)",
      style: "Organic shapes, earth tones, nature-inspired imagery"
    },
    {
      id: "tech-futuristic",
      name: "Tech Futuristic",
      description: "Sleek, high-tech aesthetic with digital elements",
      preview: "linear-gradient(135deg, hsl(200 100% 10%) 0%, hsl(260 100% 20%) 100%)",
      style: "Neon accents, dark backgrounds, geometric patterns"
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Upload Your PDF</h2>
              <p className="text-muted-foreground">
                Upload the PDF document you'd like to convert into a presentation
              </p>
            </div>
            
            <div className="upload-zone rounded-lg p-12 text-center border-2 border-dashed">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your PDF here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
              <Button variant="outline" className="mt-4">
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Choose Your Template</h2>
              <p className="text-muted-foreground">
                Select a presentation style that matches your content and audience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presentationTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="relative">
                      <div 
                        className="aspect-video rounded-md mb-3 flex items-center justify-center relative overflow-hidden"
                        style={{ background: template.preview }}
                      >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                        <div className="relative z-10 text-center text-white">
                          <div className="text-xs font-medium mb-1">Sample Slide</div>
                          <div className="text-xs opacity-80">Title Here</div>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {template.description}
                        </p>
                        <div className="text-xs text-muted-foreground/80 border-t pt-2">
                          <span className="font-medium">Style:</span> {template.style}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-medium">Selected:</span>
                  <span>{presentationTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                </div>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Generating Your Presentation</h2>
              <p className="text-muted-foreground">
                Our AI is analyzing your PDF and creating beautiful slides...
              </p>
            </div>
            
            <div className="py-12">
              <div className="text-6xl mb-4 animate-pickle-spin">🥒</div>
              <p className="text-sm text-muted-foreground">This usually takes 30-60 seconds</p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Your Presentation is Ready!</h2>
              <p className="text-muted-foreground">
                Review and edit your slides, then export when ready
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((slide) => (
                <Card key={slide} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-subtle rounded-md mb-2 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Slide {slide}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Click to edit</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="hero">
                <FileText className="w-4 h-4 mr-2" />
                Export as PPTX
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