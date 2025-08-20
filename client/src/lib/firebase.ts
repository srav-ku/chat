// Firebase client configuration
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, onValue, push, serverTimestamp, child, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCnYGs6tC6gC5wdem5fsLRqPwGGBFq8lTg",
  authDomain: "chat-now-d1c98.firebaseapp.com",
  databaseURL: "https://chat-now-d1c98-default-rtdb.firebaseio.com",
  projectId: "chat-now-d1c98",
  storageBucket: "chat-now-d1c98.appspot.com",
  messagingSenderId: "103307626261",
  appId: "1:103307626261:web:1176ee5be3e19240a48b1c",
  measurementId: "G-NVJNRWBEDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseClient {
  private static listeners: Map<string, any> = new Map();

  // User operations
  static async updateUserStatus(userId: string, isOnline: boolean) {
    try {
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        // Update existing user
        await set(child(userRef, 'isOnline'), isOnline);
        await set(child(userRef, 'lastSeen'), serverTimestamp());
      } else {
        // Create new user if doesn't exist
        await set(userRef, {
          id: userId,
          isOnline,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Firebase updateUserStatus error:', error);
      return false;
    }
  }

  static async getUser(userId: string) {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Firebase getUser error:', error);
      return null;
    }
  }

  // Message operations
  static async sendMessage(chatId: string, message: any) {
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      const messageData = {
        ...message,
        timestamp: serverTimestamp(),
        id: newMessageRef.key
      };

      await set(newMessageRef, messageData);

      // Update chat metadata
      const chatRef = ref(database, `chats/${chatId}`);
      await set(child(chatRef, 'lastMessage'), messageData);
      await set(child(chatRef, 'lastActivity'), serverTimestamp());

      return newMessageRef.key;
    } catch (error) {
      console.error('Firebase sendMessage error:', error);
      throw error;
    }
  }

  static async deleteMessage(chatId: string, messageId: string) {
    try {
      const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
      await remove(messageRef);
      return true;
    } catch (error) {
      console.error('Firebase deleteMessage error:', error);
      return false;
    }
  }

  // Real-time subscriptions
  static subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const listenerId = `messages_${chatId}`;

    // Remove existing listener if any
    this.unsubscribe(listenerId);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesObj = snapshot.val();
        const messages = Object.values(messagesObj).sort((a: any, b: any) => {
          return (a.timestamp || 0) - (b.timestamp || 0);
        });
        callback(messages);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Firebase subscribeToMessages error:', error);
      callback([]);
    });

    this.listeners.set(listenerId, unsubscribe);
    return () => this.unsubscribe(listenerId);
  }

  static subscribeToUserStatus(userId: string, callback: (status: any) => void) {
    const statusRef = ref(database, `users/${userId}`);
    const listenerId = `status_${userId}`;

    // Remove existing listener if any
    this.unsubscribe(listenerId);

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const userData = snapshot.exists() ? snapshot.val() : null;
      callback({
        isOnline: userData?.isOnline || false,
        lastSeen: userData?.lastSeen || null
      });
    }, (error) => {
      console.error('Firebase subscribeToUserStatus error:', error);
      callback({ isOnline: false, lastSeen: null });
    });

    this.listeners.set(listenerId, unsubscribe);
    return () => this.unsubscribe(listenerId);
  }

  // Utility methods
  static unsubscribe(listenerId: string) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener();
      this.listeners.delete(listenerId);
    }
  }

  static unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Typing operations (placeholder for WebSocket implementation)
  static async setTyping(chatId: string, userId: string, isTyping: boolean) {
    // This will be handled via WebSocket in the actual implementation
    console.log('Typing status:', { chatId, userId, isTyping });
    return true;
  }

  static subscribeToTyping(chatId: string, callback: (typingUsers: string[]) => void) {
    // Placeholder - typing will be handled via WebSocket
    callback([]);
    return () => {};
  }

  // Contact operations
  static async addContact(userId: string, contactId: string) {
    try {
      const contactRef = ref(database, `users/${userId}/contacts/${contactId}`);
      const chatId = [userId, contactId].sort().join('_'); // Deterministic chat ID

      await set(contactRef, {
        addedAt: serverTimestamp(),
        chatId
      });

      return { success: true, chatId };
    } catch (error) {
      console.error('Firebase addContact error:', error);
      return { success: false, error };
    }
  }

  static async getContacts(userId: string) {
    try {
      const contactsRef = ref(database, `users/${userId}/contacts`);
      const snapshot = await get(contactsRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Firebase getContacts error:', error);
      return {};
    }
  }

  static async setUserOnline(userId: string) {
    try {
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        // Update existing user
        await set(child(userRef, 'isOnline'), true);
        await set(child(userRef, 'lastSeen'), serverTimestamp());
      } else {
        // Create new user
        await set(userRef, {
          id: userId,
          isOnline: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Firebase setUserOnline error:', error);
      return false;
    }
  }
}

export { database, FirebaseClient as firebase };
export const firebaseClient = FirebaseClient;