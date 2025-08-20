import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChats, useContacts } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { storageManager } from "@/lib/storage";
import { 
  Search, 
  Moon, 
  Sun, 
  Settings, 
  Copy, 
  UserPlus, 
  Share, 
  MessageCircle,
  Users,
  Globe,
  CheckCheck,
  Menu,
  X,
  MoreVertical
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddContactModal } from "@/components/ui/modals/add-contact-modal";
import { DiscoveryModal } from "@/components/ui/modals/discovery-modal";
import { SettingsModal } from "@/components/ui/modals/settings-modal";
import { CreateGroupModal } from "@/components/ui/modals/create-group-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  activeChatId: string | null;
  onChatSelect: (chatId: string, contact: any) => void;
  onOpenDiscovery: () => void;
  onOpenAddContact: () => void;
  isConnected: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  user, 
  activeChatId, 
  onChatSelect, 
  onOpenDiscovery, 
  onOpenAddContact,
  isConnected,
  isMobile = false,
  isOpen = true,
  onClose
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'chats' | 'discover' | 'contacts'>('chats');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const { data: chats = [], isLoading: chatsLoading } = useChats(user.id);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(user.id);
  const { updateVisibility } = useAuth();
  const { toast } = useToast();

  // Initialize theme (always dark)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    // Keep dark mode only for now
    toast({
      title: "Dark mode only",
      description: "Currently only dark theme is available.",
    });
  };

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user.uniqueId);
      toast({
        title: "Copied!",
        description: "Your unique ID has been copied to clipboard.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy your ID manually.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

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
      'avatar-gradient-1',
      'avatar-gradient-2', 
      'avatar-gradient-3',
      'avatar-gradient-4'
    ];
    return gradients[index % gradients.length];
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - messageDate.getTime();

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const filteredChats = chats.filter((chat: any) => {
    if (!searchQuery) return true;
    const participant = chat.participants?.[0];
    return participant?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredContacts = contacts.filter((contact: any) => {
    if (!searchQuery) return true;
    return contact.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contact.contactName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isMobile && !isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        ${isMobile ? 'fixed left-0 top-0 z-50' : 'relative'}
        w-80 max-w-[80vw] md:max-w-none h-full bg-card border-r border-border flex flex-col
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
      `} data-testid="sidebar">

        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-blue-400" data-testid="app-title">
                ChatNow
              </h1>
              {isMobile && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 md:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent"
                data-testid="button-toggle-theme"
              >
                <Moon className="w-4 h-4 text-muted-foreground" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-2 rounded-lg hover:bg-accent"
                    data-testid="button-settings"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Create Group
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
            <div className="w-10 h-10 avatar-gradient-1 rounded-full flex items-center justify-center text-white font-medium">
              <span data-testid="user-initials">{getInitials(user.displayName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate" data-testid="user-display-name">
                {user.displayName}
              </div>
              <div className="text-xs text-muted-foreground flex items-center">
                <span>ID: </span>
                <span className="font-mono truncate" data-testid="user-unique-id">{user.uniqueId}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyUserId}
                  className="ml-1 p-0 h-auto text-blue-400 hover:text-blue-300"
                  data-testid="button-copy-user-id"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} data-testid="connection-status" />
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="p-4 border-b border-border">
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 telegram-input"
              data-testid="input-search"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'chats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 text-xs font-medium ${
                activeTab === 'chats' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-chats"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chats
            </Button>
            <Button
              variant={activeTab === 'discover' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('discover');
                onOpenDiscovery();
              }}
              className={`flex-1 text-xs font-medium ${
                activeTab === 'discover' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-discover"
            >
              <Globe className="w-3 h-3 mr-1" />
              Discover
            </Button>
            <Button
              variant={activeTab === 'contacts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 text-xs font-medium ${
                activeTab === 'contacts' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-contacts"
            >
              <Users className="w-3 h-3 mr-1" />
              Contacts
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chats' && (
            <div className="space-y-0">
              {chatsLoading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat: any, index: number) => {
                  const participant = chat.participants?.[0];
                  const lastMessage = chat.lastMessage;
                  const isActive = chat.chatId === activeChatId;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onChatSelect(chat.chatId, participant);
                        if (isMobile && onClose) onClose();
                      }}
                      className={`p-4 cursor-pointer transition-colors telegram-hover ${
                        isActive ? 'bg-accent border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                      }`}
                      data-testid={`chat-item-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-12 h-12 ${getGradientClass(index)} rounded-full flex items-center justify-center text-white font-medium`}>
                            {participant ? getInitials(participant.displayName) : '??'}
                          </div>
                          {/* Only show online status for other users, not self */}
                          {participant?.id !== user.id && (
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${participant?.isOnline ? 'bg-green-500' : 'bg-gray-500'} border-2 border-card rounded-full`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground truncate">
                              {participant?.displayName || 'Unknown User'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-muted-foreground truncate">
                              {lastMessage?.content || 'No messages'}
                            </span>
                            {lastMessage?.senderId === user.id && (
                              <CheckCheck className="w-4 h-4 text-primary ml-2" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-0">
              {contactsLoading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-4 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No contacts found' : 'No contacts yet'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact: any, index: number) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      const chatId = [user.id, contact.user.id].sort().join('_');
                      onChatSelect(chatId, contact.user);
                      if (isMobile && onClose) onClose();
                    }}
                    className="p-4 cursor-pointer transition-colors telegram-hover"
                    data-testid={`contact-item-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{contact.contactName?.charAt(0)?.toUpperCase() || contact.user?.displayName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {contact.contactName || contact.user?.displayName || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.user?.uniqueId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {formatTime(contact.addedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onOpenAddContact}
              className="telegram-button text-sm"
              data-testid="button-add-contact"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
            <Button
              onClick={copyUserId}
              variant="outline"
              className="text-sm border-border hover:bg-accent"
              data-testid="button-share-id"
            >
              <Share className="w-4 h-4 mr-2" />
              Share ID
            </Button>
          </div>
        </div>

      </div>

      <AddContactModal 
        open={showAddContact} 
        onOpenChange={setShowAddContact} 
      />
      <DiscoveryModal 
        open={showDiscovery} 
        onOpenChange={setShowDiscovery} 
      />
      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
      <CreateGroupModal 
        open={showCreateGroup} 
        onOpenChange={setShowCreateGroup} 
      />
    </>
  );
}