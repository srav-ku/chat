import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Image,
  FileText,
  CheckCheck,
  Check
} from "lucide-react";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  activeChatId: string | null;
  onChatSelect: (chatId: string, contact: any) => void;
  onOpenDiscovery: () => void;
  onOpenAddContact: () => void;
  isConnected: boolean;
}

export default function Sidebar({ 
  user, 
  activeChatId, 
  onChatSelect, 
  onOpenDiscovery, 
  onOpenAddContact,
  isConnected 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'chats' | 'discover' | 'contacts'>('chats');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { data: chats = [], isLoading: chatsLoading } = useChats(user.id);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(user.id);
  const { updateVisibility } = useAuth();
  const { toast } = useToast();

  // Initialize theme
  useEffect(() => {
    const savedTheme = storageManager.getTheme();
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    storageManager.saveTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user.uniqueId);
      toast({
        title: "Copied!",
        description: "Your unique ID has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy your ID manually.",
        variant: "destructive"
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
      'bg-avatar-gradient-1',
      'bg-avatar-gradient-2', 
      'bg-avatar-gradient-3',
      'bg-avatar-gradient-4'
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

  return (
    <div className="w-80 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold instagram-gradient-text" data-testid="app-title">
            ChatNow
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-toggle-theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-instagram-pink/10 to-instagram-purple/10 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-r from-instagram-pink to-instagram-purple rounded-full flex items-center justify-center text-white font-medium">
            <span data-testid="user-initials">{getInitials(user.displayName)}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid="user-display-name">
              {user.displayName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span>ID: </span>
              <span className="font-mono" data-testid="user-unique-id">{user.uniqueId}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyUserId}
                className="ml-1 p-0 h-auto text-instagram-pink hover:text-instagram-purple"
                data-testid="button-copy-user-id"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-gray-400'}`} data-testid="connection-status" />
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-instagram-pink/50"
            data-testid="input-search"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            variant={activeTab === 'chats' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chats')}
            className={`flex-1 text-xs font-medium ${
              activeTab === 'chats' 
                ? 'bg-white dark:bg-dark-surface text-instagram-pink shadow-sm' 
                : 'text-gray-600 dark:text-gray-300'
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
                ? 'bg-white dark:bg-dark-surface text-instagram-pink shadow-sm' 
                : 'text-gray-600 dark:text-gray-300'
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
                ? 'bg-white dark:bg-dark-surface text-instagram-pink shadow-sm' 
                : 'text-gray-600 dark:text-gray-300'
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
          <div className="space-y-1">
            {chatsLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    onClick={() => onChatSelect(chat.chatId, participant)}
                    className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      isActive ? 'bg-instagram-pink/5 border-l-4 border-l-instagram-pink' : ''
                    }`}
                    data-testid={`chat-item-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className={`w-12 h-12 ${getGradientClass(index)} rounded-full flex items-center justify-center text-white font-medium`}>
                          {participant ? getInitials(participant.displayName) : '??'}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${participant?.isOnline ? 'bg-success' : 'bg-gray-400'} border-2 border-white dark:border-dark-surface rounded-full`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {participant?.displayName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 truncate">
                            {lastMessage?.mediaType && (
                              <div className="flex items-center mr-1">
                                {lastMessage.mediaType.startsWith('image/') ? (
                                  <Image className="w-4 h-4 text-instagram-pink mr-1" />
                                ) : (
                                  <FileText className="w-4 h-4 text-instagram-pink mr-1" />
                                )}
                              </div>
                            )}
                            <span className="truncate">
                              {lastMessage?.content || (lastMessage?.mediaType ? 'Media' : 'No messages')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {lastMessage?.senderId === user.id && (
                              <CheckCheck className="w-4 h-4 text-instagram-pink" />
                            )}
                            {/* Unread count placeholder - would come from real data */}
                          </div>
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
          <div className="space-y-1">
            {contactsLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact: any, index: number) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    // Create or find chat with this contact
                    const chatId = [user.id, contact.user.id].sort().join('_');
                    onChatSelect(chatId, contact.user);
                  }}
                  className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  data-testid={`contact-item-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-12 h-12 ${getGradientClass(index)} rounded-full flex items-center justify-center text-white font-medium`}>
                        {contact.user ? getInitials(contact.user.displayName) : '??'}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${contact.user?.isOnline ? 'bg-success' : 'bg-gray-400'} border-2 border-white dark:border-dark-surface rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {contact.contactName || contact.user?.displayName || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {contact.user?.uniqueId}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onOpenAddContact}
            className="flex items-center justify-center space-x-2 py-2 px-3 btn-instagram text-sm"
            data-testid="button-add-contact"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contact</span>
          </Button>
          <Button
            onClick={copyUserId}
            variant="outline"
            className="flex items-center justify-center space-x-2 py-2 px-3 text-sm btn-outline-instagram"
            data-testid="button-share-id"
          >
            <Share className="w-4 h-4" />
            <span>Share ID</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
