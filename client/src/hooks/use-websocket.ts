import { useState, useEffect, useCallback, useRef } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketHook {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useWebSocket(userId: string | null): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId) return;

    setConnectionState('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttempts.current = 0;

        // Authenticate with server
        if (ws.current && userId) {
          ws.current.send(JSON.stringify({
            type: 'authenticate',
            userId: userId
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionState('disconnected');

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionState('error');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  // Connect when userId is available
  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    sendMessage,
    lastMessage,
    connectionState
  };
}

// Hook for typing indicators
export function useTypingIndicator(chatId: string | null, userId: string | null, sendMessage: (message: WebSocketMessage) => void) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!chatId || !userId) return;

    sendMessage({
      type: 'typing',
      chatId,
      userId,
      isTyping: true
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({
        type: 'typing',
        chatId,
        userId,
        isTyping: false
      });
    }, 3000);
  }, [chatId, userId, sendMessage]);

  const stopTyping = useCallback(() => {
    if (!chatId || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    sendMessage({
      type: 'typing',
      chatId,
      userId,
      isTyping: false
    });
  }, [chatId, userId, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    startTyping,
    stopTyping
  };
}
