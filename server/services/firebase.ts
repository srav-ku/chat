// Firebase service for real-time database operations
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, onValue, push, serverTimestamp, child } from 'firebase/database';

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

export class FirebaseService {
  // User operations
  static async createUser(userId: string, userData: any) {
    try {
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isOnline: true
      });
      return true;
    } catch (error) {
      console.error('Firebase createUser error:', error);
      return false;
    }
  }

  static async updateUserStatus(userId: string, isOnline: boolean) {
    try {
      const userRef = ref(database, `users/${userId}`);
      await set(child(userRef, 'isOnline'), isOnline);
      await set(child(userRef, 'lastSeen'), serverTimestamp());
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

  // Chat operations
  static async sendMessage(chatId: string, message: any) {
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        ...message,
        timestamp: serverTimestamp(),
        id: newMessageRef.key
      });

      // Update chat metadata
      const chatRef = ref(database, `chats/${chatId}`);
      await set(child(chatRef, 'lastMessage'), {
        ...message,
        timestamp: serverTimestamp()
      });
      await set(child(chatRef, 'lastActivity'), serverTimestamp());

      return newMessageRef.key;
    } catch (error) {
      console.error('Firebase sendMessage error:', error);
      return null;
    }
  }

  static async getMessages(chatId: string, limit = 50) {
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const snapshot = await get(messagesRef);
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val());
        return messages.sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-limit);
      }
      return [];
    } catch (error) {
      console.error('Firebase getMessages error:', error);
      return [];
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

  // Contact operations
  static async addContact(userId: string, contactId: string) {
    try {
      const contactRef = ref(database, `users/${userId}/contacts/${contactId}`);
      await set(contactRef, {
        addedAt: serverTimestamp(),
        chatId: `${userId}_${contactId}` // Create deterministic chat ID
      });

      // Also add to the other user's contacts
      const reverseContactRef = ref(database, `users/${contactId}/contacts/${userId}`);
      await set(reverseContactRef, {
        addedAt: serverTimestamp(),
        chatId: `${userId}_${contactId}`
      });

      return true;
    } catch (error) {
      console.error('Firebase addContact error:', error);
      return false;
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

  // Real-time listeners
  static subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    return onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val());
        callback(messages.sort((a: any, b: any) => a.timestamp - b.timestamp));
      } else {
        callback([]);
      }
    });
  }

  static subscribeToUserStatus(userId: string, callback: (status: any) => void) {
    const statusRef = ref(database, `users/${userId}/status`);
    return onValue(statusRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : { isOnline: false });
    });
  }

  // Cleanup operations
  static async cleanupOldChats(daysOld = 7) {
    try {
      const chatsRef = ref(database, 'chats');
      const snapshot = await get(chatsRef);

      if (snapshot.exists()) {
        const chats = snapshot.val();
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        for (const [chatId, chatData] of Object.entries(chats as any)) {
          if (chatData.lastActivity && chatData.lastActivity < cutoffTime) {
            await remove(ref(database, `chats/${chatId}`));
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Firebase cleanupOldChats error:', error);
      return false;
    }
  }

  static async cleanupInactiveUsers(daysInactive = 2) {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const cutoffTime = Date.now() - (daysInactive * 24 * 60 * 60 * 1000);

        for (const [userId, userData] of Object.entries(users as any)) {
          if (userData.status?.lastSeen && userData.status.lastSeen < cutoffTime) {
            await remove(ref(database, `users/${userId}`));
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Firebase cleanupInactiveUsers error:', error);
      return false;
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

  static async createGroup(groupData: any) {
    try {
      const groupRef = ref(database, `groups/${groupData.id}`);
      await set(groupRef, {
        ...groupData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Firebase createGroup error:', error);
      return false;
    }
  }

  static async addUserToGroup(groupId: string, userId: string) {
    try {
      const memberRef = ref(database, `groups/${groupId}/members/${userId}`);
      await set(memberRef, {
        joinedAt: serverTimestamp(),
        role: 'member'
      });
      return true;
    } catch (error) {
      console.error('Firebase addUserToGroup error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export { database };