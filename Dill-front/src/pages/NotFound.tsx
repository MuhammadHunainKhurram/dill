import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle">
      <div className="text-center animate-fade-in">
        <div className="text-6xl mb-4">🥒</div>
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">You're in a pickle! Page not found</p>
        <Button 
          variant="hero"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mx-auto"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
