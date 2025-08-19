import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicUsers, useCreateChat, useAddContact } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Search, 
  MessageCircle, 
  UserPlus,
  Users,
  Globe
} from "lucide-react";
import type { User } from "@shared/schema";

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function DiscoveryModal({ isOpen, onClose, currentUser }: DiscoveryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { data: publicUsers = [], isLoading } = usePublicUsers();
  const createChatMutation = useCreateChat();
  const addContactMutation = useAddContact();
  const { toast } = useToast();

  const filteredUsers = publicUsers.filter((user: User) => 
    user.id !== currentUser.id && (
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      'bg-avatar-gradient-1',
      'bg-avatar-gradient-2', 
      'bg-avatar-gradient-3',
      'bg-avatar-gradient-4'
    ];
    return gradients[index % gradients.length];
  };

  const getOnlineStatus = (user: User) => {
    if (user.isOnline) return 'Online now';
    
    if (user.lastSeen) {
      const lastSeen = new Date(user.lastSeen);
      const now = new Date();
      const diff = now.getTime() - lastSeen.getTime();
      
      if (diff < 60000) return 'Last seen just now';
      if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
      return `Last seen ${Math.floor(diff / 86400000)}d ago`;
    }
    
    return 'Offline';
  };

  const handleStartChat = async (targetUser: User) => {
    try {
      const chat = await createChatMutation.mutateAsync({
        userId: currentUser.id,
        contactUserId: targetUser.id
      });
      
      toast({
        title: "Chat Started! 💬",
        description: `You can now message ${targetUser.displayName}.`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Chat Failed",
        description: error.message || "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToContacts = async (targetUser: User) => {
    try {
      await addContactMutation.mutateAsync({
        userId: currentUser.id,
        contactUserId: targetUser.uniqueId,
        contactName: targetUser.displayName
      });
      
      toast({
        title: "Contact Added! 👥",
        description: `${targetUser.displayName} has been added to your contacts.`,
      });
    } catch (error: any) {
      toast({
        title: "Add Contact Failed",
        description: error.message || "Failed to add contact. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkActions = async () => {
    if (selectedUsers.size === 0) return;

    try {
      const promises = Array.from(selectedUsers).map(userId => {
        const user = publicUsers.find((u: User) => u.id === userId);
        if (user) {
          return addContactMutation.mutateAsync({
            userId: currentUser.id,
            contactUserId: user.uniqueId,
            contactName: user.displayName
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      
      toast({
        title: "Contacts Added! 👥",
        description: `${selectedUsers.size} contact(s) have been added.`,
      });
      
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast({
        title: "Bulk Add Failed",
        description: "Some contacts may not have been added. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col" data-testid="discovery-modal">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-instagram-pink" />
              <span>Discover People</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-close-discovery-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by User ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-instagram-pink/50"
                data-testid="input-search-users"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {selectedUsers.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-instagram-pink/10 rounded-lg">
                <span className="text-sm text-instagram-pink font-medium">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUsers(new Set())}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBulkActions}
                    disabled={addContactMutation.isPending}
                    className="btn-instagram text-xs"
                  >
                    Add Selected
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-instagram-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Finding people...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No users found' : 'No public users available'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Users can enable public visibility in settings'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {filteredUsers.map((user: User, index: number) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedUsers.has(user.id)
                      ? 'bg-instagram-pink/5 border-instagram-pink'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                  data-testid={`user-item-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-12 h-12 ${getGradientClass(index)} rounded-full flex items-center justify-center text-white font-medium`}>
                        {getInitials(user.displayName)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${user.isOnline ? 'bg-success' : 'bg-gray-400'} border-2 border-white dark:border-dark-surface rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {user.uniqueId}
                      </div>
                      <div className={`text-xs ${user.isOnline ? 'text-success' : 'text-gray-400'}`}>
                        {getOnlineStatus(user)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartChat(user)}
                      disabled={createChatMutation.isPending}
                      className="btn-outline-instagram text-xs"
                      data-testid={`button-chat-${index}`}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddToContacts(user)}
                      disabled={addContactMutation.isPending}
                      className="btn-instagram text-xs"
                      data-testid={`button-add-${index}`}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
