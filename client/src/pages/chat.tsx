import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { firebaseClient } from "@/lib/firebase";
import Sidebar from "@/components/ui/chat/sidebar";
import ChatArea from "@/components/ui/chat/chat-area";
import MediaModal from "@/components/ui/modals/media-modal";
import DiscoveryModal from "@/components/ui/modals/discovery-modal";
import AddContactModal from "@/components/ui/modals/add-contact-modal";

export default function ChatApp() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  
  const { isConnected, sendMessage, lastMessage } = useWebSocket(user?.id || null);

  // Set user online status
  useEffect(() => {
    if (user?.id) {
      firebaseClient.setUserOnline(user.id);
    }
  }, [user?.id]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_message':
          // Message updates are handled by Firebase listeners
          break;
        case 'typing':
          // Typing indicators are handled by Firebase listeners
          break;
        case 'user_status':
          // User status updates
          break;
      }
    }
  }, [lastMessage]);

  const handleChatSelect = (chatId: string, contact: any) => {
    setActiveChatId(chatId);
    setActiveContact(contact);
  };

  const handleOpenMediaModal = () => {
    setShowMediaModal(true);
  };

  const handleOpenDiscoveryModal = () => {
    setShowDiscoveryModal(true);
  };

  const handleOpenAddContactModal = () => {
    setShowAddContactModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chat-bg dark:bg-dark-bg">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chat-bg dark:bg-dark-bg" data-testid="chat-app">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onOpenDiscovery={handleOpenDiscoveryModal}
        onOpenAddContact={handleOpenAddContactModal}
        isConnected={isConnected}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChatId && activeContact ? (
          <ChatArea
            chatId={activeChatId}
            contact={activeContact}
            currentUser={user}
            onOpenMediaModal={handleOpenMediaModal}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-24 h-24 bg-gradient-to-r from-instagram-pink to-instagram-purple rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Welcome to ChatNow
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a chat to start messaging or discover new people to connect with.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        chatId={activeChatId}
        senderId={user.id}
      />

      <DiscoveryModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        currentUser={user}
      />

      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        currentUser={user}
      />

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-warning text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
