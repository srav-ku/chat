import cron from 'node-cron';
import { storage } from '../storage';
import { firebaseService } from './firebase';

export class CleanupService {
  private isRunning = false;

  // Initialize cleanup jobs
  init(): void {
    // Run cleanup every hour
    cron.schedule('0 * * * *', () => {
      this.runCleanupJob();
    });

    // Run inactive chat cleanup every 6 hours
    cron.schedule('0 */6 * * *', () => {
      this.cleanupInactiveChats();
    });

    console.log('Cleanup service initialized with scheduled jobs');
  }

  // Main cleanup job - removes messages older than 7 days
  private async runCleanupJob(): Promise<void> {
    if (this.isRunning) {
      console.log('Cleanup job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting message cleanup job...');

    try {
      // Clean up messages older than 7 days
      const oldMessages = await storage.getOldMessages(7);
      
      if (oldMessages.length > 0) {
        console.log(`Found ${oldMessages.length} old messages to cleanup`);
        
        // Delete from local storage
        const messageIds = oldMessages.map(m => m.messageId);
        await storage.deleteMessages(messageIds);
        
        // Clean up from Firebase
        await firebaseService.cleanupOldMessages(7);
        
        console.log(`Cleaned up ${oldMessages.length} old messages`);
      }
    } catch (error) {
      console.error('Error during message cleanup:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Cleanup inactive chats (no activity for 2+ days)
  private async cleanupInactiveChats(): Promise<void> {
    console.log('Starting inactive chat cleanup...');

    try {
      const inactiveChats = await storage.getInactiveChats(2);
      
      if (inactiveChats.length > 0) {
        console.log(`Found ${inactiveChats.length} inactive chats to cleanup`);
        
        for (const chat of inactiveChats) {
          // Get messages for this chat
          const messages = await storage.getChatMessages(chat.chatId);
          
          // Delete messages from storage
          const messageIds = messages.map(m => m.messageId);
          await storage.deleteMessages(messageIds);
          
          // Delete chat
          await storage.deleteChat(chat.chatId);
          
          console.log(`Cleaned up inactive chat: ${chat.chatId}`);
        }
      }
    } catch (error) {
      console.error('Error during inactive chat cleanup:', error);
    }
  }

  // Manual cleanup trigger for testing
  async manualCleanup(): Promise<{ messagesDeleted: number; chatsDeleted: number }> {
    const oldMessages = await storage.getOldMessages(7);
    const inactiveChats = await storage.getInactiveChats(2);

    // Cleanup old messages
    const messageIds = oldMessages.map(m => m.messageId);
    await storage.deleteMessages(messageIds);
    await firebaseService.cleanupOldMessages(7);

    // Cleanup inactive chats
    for (const chat of inactiveChats) {
      const messages = await storage.getChatMessages(chat.chatId);
      const chatMessageIds = messages.map(m => m.messageId);
      await storage.deleteMessages(chatMessageIds);
      await storage.deleteChat(chat.chatId);
    }

    return {
      messagesDeleted: oldMessages.length,
      chatsDeleted: inactiveChats.length
    };
  }
}

export const cleanupService = new CleanupService();
