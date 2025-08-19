import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uniqueId: varchar("unique_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  recoveryCode: varchar("recovery_code").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().unique(), // combination of user IDs
  participants: jsonb("participants").notNull(), // array of user IDs
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().unique(),
  chatId: varchar("chat_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  messageType: varchar("message_type").notNull(), // text, image, video, file
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contactUserId: varchar("contact_user_id").notNull(),
  contactName: text("contact_name"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  addedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
