import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <div className="text-6xl mb-4">🥒</div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Dill
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            For when you're in a Pickle
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate beautiful presentations from PDFs and financial data with AI. 
            Perfect for education and business presentations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="card-elegant card-hover animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-primary rounded-xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Education Mode
              </h2>
              <p className="text-muted-foreground mb-6">
                Transform PDFs into engaging educational presentations. 
                Perfect for teachers, students, and trainers.
              </p>
              <Button 
                className="btn-hero w-full"
                onClick={() => navigate("/education")}
              >
                Start with Education
              </Button>
            </CardContent>
          </Card>

          <Card className="card-elegant card-hover animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-primary rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Business Mode
              </h2>
              <p className="text-muted-foreground mb-6">
                Create data-driven presentations from financial reports and spreadsheets. 
                Ideal for analysts and executives.
              </p>
              <Button 
                className="btn-hero w-full"
                onClick={() => navigate("/business")}
              >
                Start with Business
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">
            Join thousands of professionals creating better presentations with AI
          </p>
        </div>
      </main>
    </div>
  );
}