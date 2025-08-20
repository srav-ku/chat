import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Bell, Lock, Palette, LogOut } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, logout, updateVisibility } = useAuth();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(user?.isPublic || false);
  const [notifications, setNotifications] = useState(true);

  const handleVisibilityChange = async (checked: boolean) => {
    try {
      await updateVisibility?.(checked);
      setIsPublic(checked);
      toast({
        title: "Settings updated",
        description: checked
          ? "Your profile is now discoverable by others"
          : "Your profile is now private",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visibility settings",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✓ Copied!",
        description: "ID copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "❌ Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <h3 className="font-medium">Profile</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={user?.displayName || ""}
                disabled
                className="telegram-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uniqueId">Unique ID</Label>
              <Input
                id="uniqueId"
                value={user?.uniqueId || ""}
                disabled
                className="telegram-input font-mono text-sm"
              />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(user?.uniqueId || "")} className="ml-2">
                Copy ID
              </Button>
            </div>
          </div>

          <Separator />

          {/* Privacy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <h3 className="font-medium">Privacy</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-profile">Discoverable Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to find and add you
                </p>
              </div>
              <Switch
                id="public-profile"
                checked={isPublic}
                onCheckedChange={handleVisibilityChange}
              />
            </div>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <h3 className="font-medium">Notifications</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for new messages
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <h3 className="font-medium">Appearance</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Dark theme is currently active
            </div>
          </div>

          <Separator />

          {/* Logout Section */}
          <div className="space-y-4">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}