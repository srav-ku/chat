import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Copy, User, Shield, MessageCircle } from "lucide-react";

export default function Welcome() {
  const [displayName, setDisplayName] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [generatedUser, setGeneratedUser] = useState<any>(null);
  
  const { 
    generateUser, 
    login, 
    isGenerating, 
    isLoggingIn, 
    generateError, 
    loginError 
  } = useAuth();
  
  const { toast } = useToast();

  const handleGenerateUser = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your display name to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await generateUser(displayName.trim());
      setGeneratedUser(result);
      setShowRecoveryCode(true);
      toast({
        title: "Account Created! 🎉",
        description: "Your unique ID and recovery code have been generated.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to create your account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async (type: 'uniqueId' | 'recoveryCode') => {
    const credentials = type === 'uniqueId' 
      ? { uniqueId: uniqueId.trim() }
      : { recoveryCode: recoveryCode.trim() };

    if (!Object.values(credentials)[0]) {
      toast({
        title: "Credential Required",
        description: `Please enter your ${type === 'uniqueId' ? 'unique ID' : 'recovery code'}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await login(credentials);
      toast({
        title: "Welcome Back! 👋",
        description: "You've been successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the text manually.",
        variant: "destructive"
      });
    }
  };

  if (showRecoveryCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chat-bg dark:bg-dark-bg p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-instagram-pink to-instagram-purple rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl instagram-gradient-text">Account Created!</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save these credentials safely. You'll need them to access your account.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Your Unique ID
                </Label>
                <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-gray-900 rounded border font-mono text-sm">
                  <span data-testid="unique-id">{generatedUser?.user?.uniqueId || "Loading..."}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedUser?.user?.uniqueId || "", "Unique ID")}
                    data-testid="button-copy-id"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Share this ID with others to start chatting
                </p>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Recovery Code
                </Label>
                <div className="flex items-center justify-between mt-1 p-3 bg-white dark:bg-gray-900 rounded border font-mono text-sm">
                  <span data-testid="recovery-code">{generatedUser?.recoveryCode || "Loading..."}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedUser?.recoveryCode || "", "Recovery Code")}
                    data-testid="button-copy-recovery"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠️ Keep this safe! It's your only way to recover your account
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => window.location.reload()}
              className="w-full btn-instagram"
              data-testid="button-continue"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Continue to ChatNow
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-chat-bg dark:bg-dark-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-instagram-pink to-instagram-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl instagram-gradient-text">ChatNow</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time messaging with privacy and style
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Account</TabsTrigger>
              <TabsTrigger value="login">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Your Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1"
                    data-testid="input-display-name"
                  />
                </div>
                
                <Button
                  onClick={handleGenerateUser}
                  disabled={isGenerating || !displayName.trim()}
                  className="w-full btn-instagram"
                  data-testid="button-create-account"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
                
                {generateError && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {generateError.message}
                  </p>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>• No email or phone number required</p>
                  <p>• Your unique ID will be generated automatically</p>
                  <p>• Keep your recovery code safe for account access</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="uniqueId">Unique ID</Label>
                  <Input
                    id="uniqueId"
                    placeholder="usr_xxxxxxxxx"
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    className="mt-1 font-mono"
                    data-testid="input-unique-id"
                  />
                  <Button
                    onClick={() => handleLogin('uniqueId')}
                    disabled={isLoggingIn || !uniqueId.trim()}
                    className="w-full mt-2 btn-outline-instagram"
                    variant="outline"
                    data-testid="button-login-id"
                  >
                    {isLoggingIn ? "Signing In..." : "Sign In with ID"}
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-card px-2 text-gray-500 dark:text-gray-400">Or</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="recoveryCode">Recovery Code</Label>
                  <Input
                    id="recoveryCode"
                    placeholder="Enter recovery code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="mt-1 font-mono"
                    data-testid="input-recovery-code"
                  />
                  <Button
                    onClick={() => handleLogin('recoveryCode')}
                    disabled={isLoggingIn || !recoveryCode.trim()}
                    className="w-full mt-2 btn-outline-instagram"
                    variant="outline"
                    data-testid="button-login-recovery"
                  >
                    {isLoggingIn ? "Signing In..." : "Recover Account"}
                  </Button>
                </div>
                
                {loginError && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {loginError.message}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
