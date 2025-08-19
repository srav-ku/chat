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
  Video
} from "lucide-react";
import type { User } from "@shared/schema";

interface ChatAreaProps {
  chatId: string;
  contact: any;
  currentUser: User;
  onOpenMediaModal: () => void;
}

export default function ChatArea({ 
  chatId, 
  contact, 
  currentUser, 
  onOpenMediaModal 
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

  return (
    <div className="flex-1 flex flex-col" data-testid="chat-area">
      {/* Chat Header */}
      <div className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-instagram-blue to-instagram-purple rounded-full flex items-center justify-center text-white font-medium">
                {getInitials(contact?.displayName || 'Unknown')}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${contact?.isOnline ? 'bg-success' : 'bg-gray-400'} border-2 border-white dark:border-dark-surface rounded-full`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white" data-testid="contact-name">
                {contact?.displayName || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="contact-status">
                {getOnlineStatus()}
                {typingUsers.length > 0 && (
                  <span className="text-instagram-pink ml-2 animate-pulse">
                    typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-toggle-mute"
            >
              {isMuted ? (
                <BellOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChatInfo(!showChatInfo)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-chat-info"
            >
              <Info className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-chat-menu"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 relative">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          isLoading={isLoading}
          typingUsers={typingUsers}
        />
        
        {sendError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            <p className="text-sm">Failed to send message. Please try again.</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onStartTyping={() => sendTyping(true)}
        onStopTyping={() => sendTyping(false)}
        onOpenMediaModal={onOpenMediaModal}
        isSending={isSending}
        chatId={chatId}
      />

      {/* Chat Info Panel (if enabled) */}
      {showChatInfo && (
        <div className="absolute right-0 top-0 w-80 h-full bg-white dark:bg-dark-surface border-l border-gray-200 dark:border-gray-700 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Chat Info</h3>
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
              <div className="w-16 h-16 bg-gradient-to-r from-instagram-blue to-instagram-purple rounded-full flex items-center justify-center text-white font-medium mx-auto mb-3">
                {getInitials(contact?.displayName || 'Unknown')}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {contact?.displayName || 'Unknown User'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {contact?.uniqueId}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Notifications</span>
                <Badge variant={isMuted ? "secondary" : "default"}>
                  {isMuted ? "Muted" : "Active"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
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
