import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, off, serverTimestamp, onDisconnect } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCnYGs6tC6gC5wdem5fsLRqPwGGBFq8lTg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chat-now-d1c98.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://chat-now-d1c98-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chat-now-d1c98",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chat-now-d1c98.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "103307626261",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:103307626261:web:1176ee5be3e19240a48b1c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NVJNRWBEDP"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseClient {
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

  // Listen to user status
  listenToUserStatus(userId: string, callback: (status: { online: boolean; lastSeen: number }) => void): () => void {
    const statusRef = ref(database, `users/${userId}/status`);
    const lastSeenRef = ref(database, `users/${userId}/lastSeen`);
    
    let status = { online: false, lastSeen: 0 };
    
    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      status.online = snapshot.val() === 'online';
      callback(status);
    });
    
    const lastSeenUnsubscribe = onValue(lastSeenRef, (snapshot) => {
      status.lastSeen = snapshot.val() || 0;
      callback(status);
    });

    return () => {
      off(statusRef, 'value', statusUnsubscribe);
      off(lastSeenRef, 'value', lastSeenUnsubscribe);
    };
  }

  // Set user online status
  async setUserOnline(userId: string): Promise<void> {
    const userStatusRef = ref(database, `users/${userId}/status`);
    const userLastSeenRef = ref(database, `users/${userId}/lastSeen`);
    
    await set(userStatusRef, 'online');
    await set(userLastSeenRef, serverTimestamp());
    
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
    } else {
      await set(typingRef, null);
    }
  }
}

export const firebaseClient = new FirebaseClient();
