
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { FirebaseClient } from "@/lib/firebase";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { isConnected, sendMessage, lastMessage } = useWebSocket(user?.id || null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set user online status
  useEffect(() => {
    if (user?.id) {
      FirebaseClient.setUserOnline(user.id);
    }
  }, [user?.id]);

  const handleChatSelect = (chatId: string, contact: any) => {
    setActiveChatId(chatId);
    setActiveContact(contact);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ChatNow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onOpenDiscovery={() => setShowDiscoveryModal(true)}
        onOpenAddContact={() => setShowAddContactModal(true)}
        isConnected={isConnected}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          chatId={activeChatId}
          contact={activeContact}
          currentUser={user}
          onOpenMediaModal={() => setShowMediaModal(true)}
          isMobile={isMobile}
          onOpenSidebar={handleOpenSidebar}
        />
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
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
