import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAddContact } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  UserPlus,
  Search,
  User
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
}

export default function AddContactModal({ isOpen, onClose, currentUser }: AddContactModalProps) {
  const [uniqueId, setUniqueId] = useState("");
  const [contactName, setContactName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const addContactMutation = useAddContact();
  const { toast } = useToast();

  const handleClose = () => {
    if (!addContactMutation.isPending) {
      setUniqueId("");
      setContactName("");
      setValidationError("");
      onClose();
    }
  };

  const validateUserId = (id: string) => {
    // Basic validation for user ID format
    const userIdPattern = /^usr_[a-f0-9]{8}$/i;
    
    if (!id.trim()) {
      setValidationError("");
      return false;
    }
    
    if (!userIdPattern.test(id.trim())) {
      setValidationError("Invalid User ID format. Expected: usr_xxxxxxxx");
      return false;
    }
    
    if (id.trim() === currentUser.uniqueId) {
      setValidationError("You cannot add yourself as a contact");
      return false;
    }
    
    setValidationError("");
    return true;
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUniqueId(value);
    validateUserId(value);
  };

  const handleAddContact = async () => {
    if (!validateUserId(uniqueId)) return;

    try {
      const result = await addContactMutation.mutateAsync({
        userId: currentUser.id,
        contactUserId: uniqueId.trim(),
        contactName: contactName.trim() || undefined
      });

      toast({
        title: "Contact Added! 👥",
        description: `${result.user?.displayName || contactName || uniqueId} has been added to your contacts.`,
      });

      handleClose();
    } catch (error: any) {
      let errorMessage = "Failed to add contact. Please try again.";
      
      if (error.message.includes("not found")) {
        errorMessage = "User not found. Please check the User ID and try again.";
      } else if (error.message.includes("already added")) {
        errorMessage = "This user is already in your contacts.";
      }

      toast({
        title: "Add Contact Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim()) {
        setUniqueId(clipboardText.trim());
        validateUserId(clipboardText.trim());
      }
    } catch (error) {
      toast({
        title: "Clipboard Access Failed",
        description: "Unable to read from clipboard. Please paste manually.",
        variant: "destructive"
      });
    }
  };

  const handleSearchNearbyUsers = () => {
    // TODO: Implement nearby user search functionality
    toast({
      title: "Feature Coming Soon",
      description: "Nearby user search will be available in a future update.",
    });
  };

  const isFormValid = uniqueId.trim() && !validationError && !addContactMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="add-contact-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-instagram-pink" />
              <span>Add Contact</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={addContactMutation.isPending}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-close-add-contact-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User ID Input */}
          <div className="space-y-2">
            <Label htmlFor="uniqueId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              User ID <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="uniqueId"
                type="text"
                placeholder="usr_xxxxxxxxx"
                value={uniqueId}
                onChange={handleUserIdChange}
                className={`font-mono ${validationError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-instagram-pink/50'}`}
                disabled={addContactMutation.isPending}
                data-testid="input-unique-id"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePasteFromClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-xs text-instagram-pink hover:text-instagram-purple"
                data-testid="button-paste-id"
              >
                Paste
              </Button>
            </div>
            {validationError && (
              <p className="text-xs text-red-600 dark:text-red-400" data-testid="validation-error">
                {validationError}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the unique ID shared by the person you want to add
            </p>
          </div>

          {/* Contact Name Input */}
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Name <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="contactName"
              type="text"
              placeholder="Enter a custom name for this contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="focus:ring-instagram-pink/50"
              disabled={addContactMutation.isPending}
              data-testid="input-contact-name"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If empty, their display name will be used
            </p>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleSearchNearbyUsers}
                disabled={addContactMutation.isPending}
                className="flex items-center justify-center space-x-2 p-3 text-sm border-gray-200 dark:border-gray-600"
                data-testid="button-search-nearby"
              >
                <Search className="w-4 h-4 text-instagram-blue" />
                <span>Find Nearby</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Generate QR code or show current user ID for sharing
                  toast({
                    title: "Your ID: " + currentUser.uniqueId,
                    description: "Share this ID with others to let them add you.",
                  });
                }}
                disabled={addContactMutation.isPending}
                className="flex items-center justify-center space-x-2 p-3 text-sm border-gray-200 dark:border-gray-600"
                data-testid="button-show-my-id"
              >
                <User className="w-4 h-4 text-instagram-purple" />
                <span>My ID</span>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={addContactMutation.isPending}
              className="flex-1"
              data-testid="button-cancel-add-contact"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={!isFormValid}
              className="flex-1 btn-instagram"
              data-testid="button-add-contact"
            >
              {addContactMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
