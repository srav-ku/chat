import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { storageManager } from "@/lib/storage";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import ChatApp from "@/pages/chat";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = storageManager.getTheme();
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference
    storageManager.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div data-theme-provider>
      {children}
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-chat-bg dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-instagram-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading ChatNow...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <ChatApp /> : <Welcome />}
      </Route>
      <Route path="/welcome">
        <Welcome />
      </Route>
      <Route path="/chat">
        {isAuthenticated ? <ChatApp /> : <Welcome />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
