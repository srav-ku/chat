import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Image as ImageIcon, 
  FileText, 
  Download,
  Play,
  CheckCheck,
  Check,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  messageId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  messageType: string;
  createdAt: Date | string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  typingUsers: string[];
}

export default function MessageList({ 
  messages, 
  currentUserId, 
  isLoading, 
  typingUsers 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isToday = (date: Date | string) => {
    const messageDate = new Date(date);
    const today = new Date();
    return messageDate.toDateString() === today.toDateString();
  };

  const getDateDivider = (date: Date | string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Today';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: messageDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const renderMessage = (message: Message, index: number) => {
    const isSent = message.senderId === currentUserId;
    const showDateDivider = index === 0 || 
      new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

    return (
      <div key={message.id}>
        {/* Date Divider */}
        {showDateDivider && (
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white dark:bg-dark-surface px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 shadow-sm">
              {getDateDivider(message.createdAt)}
            </div>
          </div>
        )}

        {/* Message */}
        <div className={`flex items-start space-x-2 mb-4 animate-slide-up ${isSent ? 'justify-end' : 'justify-start'}`}>
          {/* Avatar for received messages */}
          {!isSent && (
            <div className="w-8 h-8 bg-gradient-to-r from-instagram-blue to-instagram-purple rounded-full flex items-center justify-center text-white text-xs font-medium">
              {message.senderId.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className={`flex flex-col space-y-1 message-bubble ${isSent ? 'message-sent' : 'message-received'}`}>
            {/* Message Bubble */}
            <div className={`px-4 py-2 shadow-sm ${
              isSent 
                ? 'bg-gradient-to-r from-instagram-pink to-instagram-purple text-white rounded-2xl rounded-tr-sm' 
                : 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
            }`}>
              {/* Text Content */}
              {message.content && message.messageType === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Image Content */}
              {message.mediaUrl && message.mediaType?.startsWith('image/') && (
                <div className="space-y-2">
                  <img
                    src={message.mediaUrl}
                    alt={message.fileName || 'Image'}
                    className="rounded-xl w-full h-auto cursor-pointer hover:opacity-90 transition-opacity media-preview max-w-xs"
                    onClick={() => setSelectedImage(message.mediaUrl!)}
                    data-testid="message-image"
                  />
                  {message.content && (
                    <p className={`text-sm ${isSent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {message.content}
                    </p>
                  )}
                </div>
              )}

              {/* Video Content */}
              {message.mediaUrl && message.mediaType?.startsWith('video/') && (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden media-preview max-w-xs">
                    <video
                      src={message.mediaUrl}
                      className="w-full h-auto"
                      controls
                      data-testid="message-video"
                    />
                  </div>
                  {message.content && (
                    <p className={`text-sm ${isSent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {message.content}
                    </p>
                  )}
                </div>
              )}

              {/* File Content */}
              {message.mediaUrl && !message.mediaType?.startsWith('image/') && !message.mediaType?.startsWith('video/') && (
                <div className="file-attachment max-w-xs">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.fileName || 'File'}
                    </p>
                    {message.fileSize && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(message.fileSize)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    data-testid="button-download-file"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Message Info */}
            <div className={`text-xs text-gray-500 dark:text-gray-400 px-2 ${isSent ? 'text-right' : 'text-left'}`}>
              <span>{formatTime(message.createdAt)}</span>
              {isSent && (
                <CheckCheck className="w-3 h-3 text-instagram-pink ml-1 inline" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="flex items-start space-x-2 mb-4 animate-fade-in">
        <div className="w-8 h-8 bg-gradient-to-r from-instagram-blue to-instagram-purple rounded-full flex items-center justify-center text-white text-xs font-medium">
          {typingUsers[0].substring(0, 2).toUpperCase()}
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-instagram-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" data-testid="message-list">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            {renderTypingIndicator()}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              onClick={() => setSelectedImage(null)}
              variant="ghost"
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full p-2"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
