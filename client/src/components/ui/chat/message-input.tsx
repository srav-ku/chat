import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storageManager } from "@/lib/storage";
import { 
  Paperclip, 
  Image as ImageIcon, 
  Send, 
  Smile,
  Mic
} from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, type?: string) => Promise<void>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  onOpenMediaModal: () => void;
  isSending: boolean;
  chatId: string;
}

export default function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onOpenMediaModal,
  isSending,
  chatId
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft message
  useEffect(() => {
    const draft = storageManager.getDraft(chatId);
    if (draft) {
      setMessage(draft);
    }
  }, [chatId]);

  // Save draft message
  useEffect(() => {
    storageManager.saveDraft(chatId, message);
  }, [message, chatId]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    onStartTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    const content = message.trim();
    setMessage("");
    storageManager.clearDraft(chatId);
    onStopTyping();
    
    try {
      await onSendMessage(content);
    } catch (error) {
      // Restore message if sending failed
      setMessage(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file upload
      console.log('File selected:', file);
      onOpenMediaModal();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Implement voice recording
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Implement voice recording
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700 p-4" data-testid="message-input">
      <div className="flex items-end space-x-3">
        {/* Attachment buttons */}
        <div className="flex space-x-2">
          <input
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => document.getElementById('file-input')?.click()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </Button>
          
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-input"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => document.getElementById('image-input')?.click()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="button-attach-media"
          >
            <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
        
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none rounded-2xl border-0 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-instagram-pink/50 max-h-32 message-input"
            rows={1}
            disabled={isSending}
            data-testid="textarea-message"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            data-testid="button-emoji"
          >
            <Smile className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
        
        {/* Send/Voice button */}
        {message.trim() ? (
          <Button
            onClick={handleSendMessage}
            disabled={isSending}
            className="p-3 bg-gradient-to-r from-instagram-pink to-instagram-purple text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            data-testid="button-send"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-gradient-to-r from-instagram-pink to-instagram-purple text-white hover:shadow-lg'
            }`}
            data-testid="button-voice"
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
