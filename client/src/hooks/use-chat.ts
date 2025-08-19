import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { firebaseClient } from '@/lib/firebase';
import { useWebSocket } from './use-websocket';
import type { Chat, Message, Contact } from '@shared/schema';

export function useChats(userId: string | null) {
  return useQuery({
    queryKey: ['/api/chats', userId],
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase real-time listener
  useEffect(() => {
    if (!chatId) return;

    setIsLoading(true);
    
    const unsubscribe = firebaseClient.listenToChatMessages(chatId, (firebaseMessages) => {
      setMessages(firebaseMessages);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [chatId]);

  return {
    data: messages,
    isLoading,
    error: null
  };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate chat queries to refresh chat list
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    }
  });
}

export function useContacts(userId: string | null) {
  return useQuery({
    queryKey: ['/api/contacts', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: { userId: string; contactUserId: string; contactName?: string }) => {
      const response = await apiRequest('POST', '/api/contacts', contactData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts', variables.userId] });
    }
  });
}

export function usePublicUsers() {
  return useQuery({
    queryKey: ['/api/users/public'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, contactUserId }: { userId: string; contactUserId: string }) => {
      const response = await apiRequest('POST', '/api/chats', { userId, contactUserId });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', variables.userId] });
    }
  });
}

export function useTypingIndicator(chatId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = firebaseClient.listenToTyping(chatId, setTypingUsers);
    return unsubscribe;
  }, [chatId]);

  return typingUsers;
}

export function useUserStatus(userId: string | null) {
  const [status, setStatus] = useState<{ online: boolean; lastSeen: number }>({
    online: false,
    lastSeen: 0
  });

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firebaseClient.listenToUserStatus(userId, setStatus);
    return unsubscribe;
  }, [userId]);

  return status;
}

// Combined chat hook with real-time features
export function useChatRoom(chatId: string | null, currentUserId: string | null) {
  const { data: messages, isLoading: messagesLoading } = useChatMessages(chatId);
  const typingUsers = useTypingIndicator(chatId);
  const sendMessageMutation = useSendMessage();
  const { sendMessage: sendWSMessage } = useWebSocket(currentUserId);

  const sendMessage = useCallback(async (content: string, messageType: string = 'text') => {
    if (!chatId || !currentUserId || !content.trim()) return;

    const messageData = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: currentUserId,
      messageType,
      content: content.trim(),
      isPrivate: false
    };

    return sendMessageMutation.mutateAsync(messageData);
  }, [chatId, currentUserId, sendMessageMutation]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!chatId || !currentUserId) return;

    firebaseClient.setTyping(chatId, currentUserId, isTyping);
    sendWSMessage({
      type: 'typing',
      chatId,
      userId: currentUserId,
      isTyping
    });
  }, [chatId, currentUserId, sendWSMessage]);

  const joinChat = useCallback(() => {
    if (!chatId || !currentUserId) return;

    sendWSMessage({
      type: 'join_chat',
      chatId,
      userId: currentUserId
    });
  }, [chatId, currentUserId, sendWSMessage]);

  // Auto-join chat when chatId changes
  useEffect(() => {
    joinChat();
  }, [joinChat]);

  return {
    messages,
    typingUsers: typingUsers.filter(userId => userId !== currentUserId),
    isLoading: messagesLoading,
    sendMessage,
    sendTyping,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error
  };
}
