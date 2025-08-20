import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { FirebaseService } from './services/firebase';
import { cloudinaryService } from "./services/cloudinary";
import { sheetsService } from "./services/sheets";
import { cleanupService } from "./services/cleanup";
import { insertUserSchema, insertMessageSchema, insertContactSchema } from "@shared/schema";
import { randomBytes } from "crypto";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store WebSocket connections
const connections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Initialize cleanup service
  cleanupService.init();

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'authenticate':
            if (message.userId) {
              connections.set(message.userId, ws);
              await FirebaseService.setUserOnline(message.userId);
              ws.send(JSON.stringify({ type: 'authenticated', userId: message.userId }));
            }
            break;

          case 'typing':
            if (message.chatId && message.userId) {
              await FirebaseService.setTyping(message.chatId, message.userId, message.isTyping);
              // Broadcast to other participants
              broadcastToChatParticipants(message.chatId, message.userId, {
                type: 'typing',
                chatId: message.chatId,
                userId: message.userId,
                isTyping: message.isTyping
              });
            }
            break;

          case 'join_chat':
            if (message.chatId && message.userId) {
              // Join user to chat room for real-time updates
              ws.send(JSON.stringify({ 
                type: 'joined_chat', 
                chatId: message.chatId 
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection and set user offline
      for (const [userId, connection] of connections.entries()) {
        if (connection === ws) {
          connections.delete(userId);
          storage.updateUserOnlineStatus(userId, false);
          break;
        }
      }
    });
  });

  // Utility function to broadcast messages to chat participants
  function broadcastToChatParticipants(chatId: string, excludeUserId: string, message: any) {
    connections.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Auth Routes
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { uniqueId, recoveryCode } = req.body;

      let user;
      if (uniqueId) {
        user = await storage.getUserByUniqueId(uniqueId);
      } else if (recoveryCode) {
        user = await storage.getUserByRecoveryCode(recoveryCode);
      }

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      await storage.updateUserOnlineStatus(user.id, true);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/generate-recovery", async (req, res) => {
    try {
      const { displayName } = req.body;

      // Generate unique ID and recovery code
      const uniqueId = `usr_${randomBytes(4).toString('hex')}`;
      const recoveryCode = randomBytes(8).toString('hex').toUpperCase();

      const userData = {
        uniqueId,
        displayName,
        recoveryCode,
        isPublic: false,
        isOnline: true
      };

      const user = await storage.createUser(userData);

      // Log user creation to sheets
      await sheetsService.logUserAction(user.id, 'user_created', { uniqueId, displayName });

      res.json({ 
        success: true, 
        user,
        recoveryCode 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User Routes
  app.get("/api/users/public", async (req, res) => {
    try {
      const users = await storage.getPublicUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id/visibility", async (req, res) => {
    try {
      const { id } = req.params;
      const { isPublic } = req.body;

      const user = await storage.updateUser(id, { isPublic });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Chat Routes
  app.get("/api/chats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const chats = await storage.getUserChats(userId);

      // Get chat details with participant info
      const chatDetails = await Promise.all(
        chats.map(async (chat) => {
          const participants = chat.participants as string[];
          const otherParticipants = participants.filter(p => p !== userId);

          const participantDetails = await Promise.all(
            otherParticipants.map(p => storage.getUser(p))
          );

          const messages = await storage.getChatMessages(chat.chatId, 1);
          const lastMessage = messages[0] || null;

          return {
            ...chat,
            participants: participantDetails.filter(Boolean),
            lastMessage
          };
        })
      );

      res.json(chatDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chats", async (req, res) => {
    try {
      const { userId, contactUserId } = req.body;

      // Generate chat ID from user IDs (sorted for consistency)
      const participants = [userId, contactUserId].sort();
      const chatId = participants.join('_');

      // Check if chat already exists
      let chat = await storage.getChat(chatId);

      if (!chat) {
        // Create new chat
        chat = await storage.createChat({
          chatId,
          participants,
          lastActivity: new Date()
        });
      }

      res.json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Message Routes
  app.get("/api/messages/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await storage.getChatMessages(
        chatId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);

      // Create message in local storage
      const message = await storage.createMessage(messageData);

      // Send to Firebase for real-time updates
      await FirebaseService.sendMessage(messageData.chatId, messageData);

      // Log to Google Sheets
      await sheetsService.logMessage({
        timestamp: message.createdAt,
        messageId: message.messageId,
        senderId: message.senderId,
        chatId: message.chatId,
        messageType: message.messageType,
        content: message.content || '',
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        isPrivate: message.isPrivate,
        action: 'sent'
      });

      // Update chat activity
      await storage.updateChatActivity(messageData.chatId);

      // Broadcast to WebSocket clients
      broadcastToChatParticipants(messageData.chatId, messageData.senderId, {
        type: 'new_message',
        message
      });

      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/messages/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      const { chatId } = req.query;

      // Delete from local storage
      await storage.deleteMessage(messageId);

      // Delete from Firebase
      if (chatId) {
        await FirebaseService.deleteMessage(chatId as string, messageId);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Media Upload Routes
  app.post("/api/upload/media", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { chatId, senderId, messageType } = req.body;

      // Determine resource type
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      if (req.file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadMedia(
        req.file.buffer,
        req.file.originalname,
        resourceType
      );

      // Create media message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        messageId,
        chatId,
        senderId,
        messageType: messageType || 'file',
        content: `Shared ${req.file.originalname}`,
        mediaUrl: uploadResult.url,
        mediaType: req.file.mimetype,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        isPrivate: false
      };

      // Save message
      const message = await storage.createMessage(messageData);

      // Send to Firebase
      await FirebaseService.sendMessage(chatId, messageData);

      // Log to Google Sheets
      await sheetsService.logMediaUpload(
        messageId,
        senderId,
        chatId,
        uploadResult.url,
        req.file.mimetype,
        req.file.originalname,
        req.file.size
      );

      res.json({ 
        success: true, 
        message, 
        mediaUrl: uploadResult.url,
        publicId: uploadResult.publicId
      });
    } catch (error: any) {
      console.error('Media upload error:', error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // Contact Routes
  app.get("/api/contacts/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const contacts = await storage.getUserContacts(userId);

      // Get contact user details
      const contactDetails = await Promise.all(
        contacts.map(async (contact) => {
          const user = await storage.getUser(contact.contactUserId);
          return {
            ...contact,
            user
          };
        })
      );

      res.json(contactDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);

      // Check if user exists
      const contactUser = await storage.getUserByUniqueId(contactData.contactUserId);
      if (!contactUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if contact already exists
      const exists = await storage.checkContact(contactData.userId, contactUser.id);
      if (exists) {
        return res.status(400).json({ error: "Contact already added" });
      }

      // Create contact with actual user ID
      const contact = await storage.createContact({
        ...contactData,
        contactUserId: contactUser.id,
        contactName: contactData.contactName || contactUser.displayName
      });

      res.json({ ...contact, user: contactUser });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin/Debug Routes
  app.post("/api/admin/cleanup", async (req, res) => {
    try {
      const result = await cleanupService.manualCleanup();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", async (req, res) => {
    try {
      const sheetsStatus = await sheetsService.testConnection();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          sheets: sheetsStatus,
          websocket: wss.clients.size
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}