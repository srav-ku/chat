import { type User, type InsertUser, type Chat, type InsertChat, type Message, type InsertMessage, type Contact, type InsertContact } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUniqueId(uniqueId: string): Promise<User | undefined>;
  getUserByRecoveryCode(recoveryCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getPublicUsers(): Promise<User[]>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;

  // Chats
  getChat(chatId: string): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: string): Promise<Chat[]>;
  updateChatActivity(chatId: string): Promise<void>;
  getInactiveChats(daysSince: number): Promise<Chat[]>;
  deleteChat(chatId: string): Promise<void>;

  // Messages
  getChatMessages(chatId: string, limit?: number, offset?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  getOldMessages(daysSince: number): Promise<Message[]>;
  deleteMessages(messageIds: string[]): Promise<void>;

  // Contacts
  getUserContacts(userId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  deleteContact(userId: string, contactUserId: string): Promise<void>;
  checkContact(userId: string, contactUserId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private contacts: Map<string, Contact>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.contacts = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUniqueId(uniqueId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.uniqueId === uniqueId);
  }

  async getUserByRecoveryCode(recoveryCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.recoveryCode === recoveryCode);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      lastSeen: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getPublicUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isPublic);
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  // Chats
  async getChat(chatId: string): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(chat => chat.chatId === chatId);
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = randomUUID();
    const chat: Chat = { 
      ...insertChat, 
      id, 
      createdAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(chat => {
      const participants = chat.participants as string[];
      return participants.includes(userId);
    });
  }

  async updateChatActivity(chatId: string): Promise<void> {
    const chat = Array.from(this.chats.values()).find(c => c.chatId === chatId);
    if (chat) {
      chat.lastActivity = new Date();
      this.chats.set(chat.id, chat);
    }
  }

  async getInactiveChats(daysSince: number): Promise<Chat[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);
    
    return Array.from(this.chats.values()).filter(chat => 
      chat.lastActivity < cutoffDate
    );
  }

  async deleteChat(chatId: string): Promise<void> {
    const chat = Array.from(this.chats.values()).find(c => c.chatId === chatId);
    if (chat) {
      this.chats.delete(chat.id);
    }
  }

  // Messages
  async getChatMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);
    
    return messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = Array.from(this.messages.values()).find(m => m.messageId === messageId);
    if (message) {
      this.messages.delete(message.id);
    }
  }

  async getOldMessages(daysSince: number): Promise<Message[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);
    
    return Array.from(this.messages.values()).filter(message => 
      message.createdAt < cutoffDate
    );
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    for (const messageId of messageIds) {
      await this.deleteMessage(messageId);
    }
  }

  // Contacts
  async getUserContacts(userId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => 
      contact.userId === userId
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { 
      ...insertContact, 
      id, 
      addedAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async deleteContact(userId: string, contactUserId: string): Promise<void> {
    const contact = Array.from(this.contacts.values()).find(c => 
      c.userId === userId && c.contactUserId === contactUserId
    );
    if (contact) {
      this.contacts.delete(contact.id);
    }
  }

  async checkContact(userId: string, contactUserId: string): Promise<boolean> {
    return Array.from(this.contacts.values()).some(contact => 
      contact.userId === userId && contact.contactUserId === contactUserId
    );
  }
}

export const storage = new MemStorage();
