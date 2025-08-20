
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storageManager } from "@/lib/storage";
import { 
  Paperclip, 
  Image as ImageIcon, 
  Send, 
  Smile,
  Mic,
  Plus
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
  const [showAttachments, setShowAttachments] = useState(false);
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
      console.log('File selected:', file);
      onOpenMediaModal();
      setShowAttachments(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // TODO: Implement voice recording
    } else {
      setIsRecording(true);
      // TODO: Implement voice recording
    }
  };

  return (
    <div className="bg-card border-t border-border p-4" data-testid="message-input">
      {/* Attachment menu */}
      {showAttachments && (
        <div className="mb-3 flex space-x-2 animate-fade-in">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-input"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => document.getElementById('image-input')?.click()}
            className="text-xs"
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            Photo
          </Button>
          
          <input
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => document.getElementById('file-input')?.click()}
            className="text-xs"
          >
            <Paperclip className="w-4 h-4 mr-1" />
            File
          </Button>
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Attachment button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAttachments(!showAttachments)}
          className="p-2 rounded-full hover:bg-accent flex-shrink-0"
          data-testid="button-attach"
        >
          <Plus className={`w-5 h-5 text-muted-foreground transition-transform ${showAttachments ? 'rotate-45' : ''}`} />
        </Button>
        
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none rounded-2xl border-0 bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary max-h-32 message-input min-h-[44px]"
            rows={1}
            disabled={isSending}
            data-testid="textarea-message"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-accent/50"
            data-testid="button-emoji"
          >
            <Smile className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        
        {/* Send/Voice button */}
        {message.trim() ? (
          <Button
            onClick={handleSendMessage}
            disabled={isSending}
            className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all disabled:opacity-50 flex-shrink-0"
            data-testid="button-send"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-all flex-shrink-0 ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            data-testid="button-voice"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
