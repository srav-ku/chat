import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, off, serverTimestamp, onDisconnect } from 'firebase/database';
import type { Message } from '@shared/schema';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCnYGs6tC6gC5wdem5fsLRqPwGGBFq8lTg",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "chat-now-d1c98.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://chat-now-d1c98-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "chat-now-d1c98",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "chat-now-d1c98.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "103307626261",
  appId: process.env.FIREBASE_APP_ID || "1:103307626261:web:1176ee5be3e19240a48b1c",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-NVJNRWBEDP"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  // Send message to Firebase Realtime Database
  async sendMessage(chatId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      ...message,
      timestamp: serverTimestamp(),
      id: newMessageRef.key
    };
    
    await set(newMessageRef, messageData);
    return newMessageRef.key!;
  }

  // Listen to messages for a specific chat
  listenToChatMessages(chatId: string, callback: (messages: any[]) => void): () => void {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messages = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        callback(messages.sort((a: any, b: any) => a.timestamp - b.timestamp));
      } else {
        callback([]);
      }
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }

  // Set user online status
  async setUserOnline(userId: string): Promise<void> {
    const userStatusRef = ref(database, `users/${userId}/status`);
    const userLastSeenRef = ref(database, `users/${userId}/lastSeen`);
    
    // Set user as online
    await set(userStatusRef, 'online');
    await set(userLastSeenRef, serverTimestamp());
    
    // Set user as offline when disconnected
    onDisconnect(userStatusRef).set('offline');
    onDisconnect(userLastSeenRef).set(serverTimestamp());
  }

  // Set typing indicator
  async setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(database, `chats/${chatId}/typing/${userId}`);
    
    if (isTyping) {
      await set(typingRef, {
        isTyping: true,
        timestamp: serverTimestamp()
      });
      
      // Clear typing indicator after 3 seconds
      setTimeout(async () => {
        await set(typingRef, null);
      }, 3000);
    } else {
      await set(typingRef, null);
    }
  }

  // Listen to typing indicators
  listenToTyping(chatId: string, callback: (typingUsers: string[]) => void): () => void {
    const typingRef = ref(database, `chats/${chatId}/typing`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      const typingUsers: string[] = [];
      
      if (data) {
        Object.entries(data).forEach(([userId, info]: [string, any]) => {
          if (info?.isTyping) {
            typingUsers.push(userId);
          }
        });
      }
      
      callback(typingUsers);
    });

    return () => off(typingRef, 'value', unsubscribe);
  }

  // Delete message from Firebase
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    await set(messageRef, null);
  }

  // Clean up old messages (runs via cron job)
  async cleanupOldMessages(daysSince: number = 7): Promise<void> {
    const cutoffTimestamp = Date.now() - (daysSince * 24 * 60 * 60 * 1000);
    const chatsRef = ref(database, 'chats');
    
    onValue(chatsRef, (snapshot) => {
      const chats = snapshot.val();
      if (chats) {
        Object.entries(chats).forEach(([chatId, chatData]: [string, any]) => {
          if (chatData.messages) {
            Object.entries(chatData.messages).forEach(([messageId, messageData]: [string, any]) => {
              if (messageData.timestamp < cutoffTimestamp) {
                const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
                set(messageRef, null);
              }
            });
          }
        });
      }
    }, { onlyOnce: true });
  }
}

export const firebaseService = new FirebaseService();
