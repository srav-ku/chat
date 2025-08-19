import type { User } from '@shared/schema';

export interface UserSession {
  user: User;
  recoveryCode?: string;
  lastLogin: string;
}

export class StorageManager {
  private readonly USER_SESSION_KEY = 'chat_user_session';
  private readonly THEME_KEY = 'chat_theme';
  private readonly CONTACTS_KEY = 'chat_contacts';

  // User session management
  saveUserSession(session: UserSession): void {
    try {
      window.localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  }

  getUserSession(): UserSession | null {
    try {
      const sessionData = window.localStorage.getItem(this.USER_SESSION_KEY);
      if (!sessionData) return null;
      
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      return null;
    }
  }

  clearUserSession(): void {
    try {
      window.localStorage.removeItem(this.USER_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }

  // Theme management
  saveTheme(theme: 'light' | 'dark'): void {
    try {
      window.localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  getTheme(): 'light' | 'dark' | null {
    try {
      const theme = window.localStorage.getItem(this.THEME_KEY);
      return theme as 'light' | 'dark' | null;
    } catch (error) {
      console.error('Failed to retrieve theme:', error);
      return null;
    }
  }

  // Contact cache (for offline support)
  saveContacts(userId: string, contacts: any[]): void {
    try {
      const key = `${this.CONTACTS_KEY}_${userId}`;
      window.localStorage.setItem(key, JSON.stringify({
        contacts,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save contacts:', error);
    }
  }

  getContacts(userId: string): { contacts: any[]; lastUpdated: string } | null {
    try {
      const key = `${this.CONTACTS_KEY}_${userId}`;
      const data = window.localStorage.getItem(key);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to retrieve contacts:', error);
      return null;
    }
  }

  // Chat settings
  saveChatSettings(chatId: string, settings: any): void {
    try {
      const key = `chat_settings_${chatId}`;
      window.localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save chat settings:', error);
    }
  }

  getChatSettings(chatId: string): any | null {
    try {
      const key = `chat_settings_${chatId}`;
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve chat settings:', error);
      return null;
    }
  }

  // Message drafts
  saveDraft(chatId: string, content: string): void {
    try {
      const key = `draft_${chatId}`;
      if (content.trim()) {
        window.localStorage.setItem(key, content);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  getDraft(chatId: string): string | null {
    try {
      const key = `draft_${chatId}`;
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve draft:', error);
      return null;
    }
  }

  clearDraft(chatId: string): void {
    try {
      const key = `draft_${chatId}`;
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  // Utility methods
  getStorageUsage(): { used: number; available: number } {
    try {
      let used = 0;
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          used += window.localStorage[key].length + key.length;
        }
      }
      
      // Estimate available space (5MB typical limit)
      const available = 5 * 1024 * 1024 - used;
      return { used, available };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, available: 0 };
    }
  }

  clearAllData(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
}

export const storageManager = new StorageManager();
