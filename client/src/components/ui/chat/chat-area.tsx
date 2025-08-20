
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatRoom } from "@/hooks/use-chat";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { 
  Bell, 
  BellOff, 
  Info, 
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Menu,
  MessageCircle
} from "lucide-react";
import type { User } from "@shared/schema";

interface ChatAreaProps {
  chatId: string;
  contact: any;
  currentUser: User;
  onOpenMediaModal: () => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

export default function ChatArea({ 
  chatId, 
  contact, 
  currentUser, 
  onOpenMediaModal,
  isMobile = false,
  onOpenSidebar
}: ChatAreaProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  
  const {
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    sendTyping,
    isSending,
    sendError
  } = useChatRoom(chatId, currentUser.id);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getOnlineStatus = () => {
    if (contact?.isOnline) return 'Online';
    if (contact?.lastSeen) {
      const lastSeen = new Date(contact.lastSeen);
      const now = new Date();
      const diff = now.getTime() - lastSeen.getTime();
      
      if (diff < 60000) return 'Last seen just now';
      if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)} min ago`;
      if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)} hours ago`;
      return `Last seen ${Math.floor(diff / 86400000)} days ago`;
    }
    return 'Offline';
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement mute functionality
  };

  const handleSendMessage = async (content: string, messageType: string = 'text') => {
    try {
      await sendMessage(content, messageType);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!chatId || !contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to ChatNow</h2>
          <p className="text-muted-foreground">
            Select a chat to start messaging or discover new people to connect with.
          </p>
          {isMobile && (
            <Button 
              onClick={onOpenSidebar}
              className="mt-4 telegram-button"
            >
              <Menu className="w-4 h-4 mr-2" />
              Open Chats
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full" data-testid="chat-area">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onOpenSidebar}
                className="p-2 mr-2 md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="relative">
              <div className="w-10 h-10 avatar-gradient-2 rounded-full flex items-center justify-center text-white font-medium">
                {getInitials(contact?.displayName || 'Unknown')}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${contact?.isOnline ? 'bg-green-500' : 'bg-gray-500'} border-2 border-card rounded-full`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate" data-testid="contact-name">
                {contact?.displayName || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground truncate" data-testid="contact-status">
                {getOnlineStatus()}
                {typingUsers.length > 0 && (
                  <span className="text-blue-400 ml-2 animate-pulse">
                    typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-lg hover:bg-accent hidden sm:flex"
              data-testid="button-call"
            >
              <Phone className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-lg hover:bg-accent hidden sm:flex"
              data-testid="button-video"
            >
              <Video className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-accent"
              data-testid="button-toggle-mute"
            >
              {isMuted ? (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Bell className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChatInfo(!showChatInfo)}
              className="p-2 rounded-lg hover:bg-accent"
              data-testid="button-chat-info"
            >
              <Info className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-background relative overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          isLoading={isLoading}
          typingUsers={typingUsers}
        />
        
        {sendError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg z-10">
            <p className="text-sm">Failed to send message. Please try again.</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          onStartTyping={() => sendTyping(true)}
          onStopTyping={() => sendTyping(false)}
          onOpenMediaModal={onOpenMediaModal}
          isSending={isSending}
          chatId={chatId}
        />
      </div>

      {/* Chat Info Panel */}
      {showChatInfo && (
        <div className="absolute right-0 top-0 w-80 h-full bg-card border-l border-border z-20 shadow-xl">
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Chat Info</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowChatInfo(false)}
                className="p-1"
              >
                ✕
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 avatar-gradient-2 rounded-full flex items-center justify-center text-white font-medium mx-auto mb-3">
                {getInitials(contact?.displayName || 'Unknown')}
              </div>
              <h4 className="font-medium text-foreground">
                {contact?.displayName || 'Unknown User'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {contact?.uniqueId}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notifications</span>
                <Badge variant={isMuted ? "secondary" : "default"}>
                  {isMuted ? "Muted" : "Active"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={contact?.isOnline ? "default" : "secondary"}>
                  {contact?.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
