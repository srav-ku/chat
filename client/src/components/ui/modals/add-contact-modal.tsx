
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded?: (contactId: string) => void;
}

export function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [contactId, setContactId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddContact = async () => {
    if (!contactId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a contact ID",
        variant: "destructive",
      });
      return;
    }

    if (contactId === user?.id) {
      toast({
        title: "Error", 
        description: "You cannot add yourself as a contact",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          contactId: contactId.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contact added successfully",
        });
        setContactId('');
        onContactAdded?.(contactId.trim());
        onClose();
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: error || "Failed to add contact",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Enter the unique ID of the person you want to add as a contact.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-id">Contact ID</Label>
            <Input
              id="contact-id"
              placeholder="usr_xxxxxxxxx"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleAddContact();
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={isLoading || !contactId.trim()}>
              {isLoading ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AddContactModal };
