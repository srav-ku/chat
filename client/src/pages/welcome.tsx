
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ArrowRight, MessageCircle } from "lucide-react";

export default function Welcome() {
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { generateUser, user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Always use dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your display name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await generateUser(displayName.trim());
      toast({
        title: "Welcome!",
        description: "You've successfully joined ChatNow.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToChat = () => {
    window.location.href = '/chat';
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-border">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Welcome back!</CardTitle>
            <CardDescription className="text-muted-foreground">
              You're signed in as <span className="font-medium text-foreground">{user.displayName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Your unique ID:</div>
              <div className="font-mono text-sm text-foreground bg-background px-3 py-2 rounded border">
                {user.uniqueId}
              </div>
            </div>
            
            <Button 
              onClick={proceedToChat}
              className="w-full telegram-button"
              size="lg"
            >
              Start Chatting
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome to ChatNow</CardTitle>
          <CardDescription className="text-muted-foreground">
            Create an account to start chatting with people around the world
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="telegram-input"
                disabled={isLoading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full telegram-button"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Join ChatNow
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time messaging</li>
              <li>• Media sharing</li>
              <li>• Discover new people</li>
              <li>• Dark theme interface</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
