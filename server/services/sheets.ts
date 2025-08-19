const APPSCRIPT_URL = process.env.GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbzWOQyCYP0sLz5_y4OOCUIvqAbQHknC8rgQAEo0_6NS/dev';
const SHARED_TOKEN = process.env.SHEETS_TOKEN || 'default_token';

export interface SheetMessage {
  timestamp: Date;
  messageId: string;
  senderId: string;
  chatId: string;
  groupId?: string;
  messageType: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  fileSize?: number;
  fileName?: string;
  isPrivate: boolean;
  action: string;
  mediaId?: string;
  uploadedBy?: string;
  flaggedUserId?: string;
  flaggedBy?: string;
  reason?: string;
}

export class GoogleSheetsService {
  // Log message to Google Sheets
  async logMessage(message: SheetMessage): Promise<boolean> {
    try {
      const payload = {
        timestamp: message.timestamp,
        messageId: message.messageId,
        senderId: message.senderId,
        chatId: message.chatId,
        groupId: message.groupId || '',
        messageType: message.messageType,
        content: message.content,
        mediaUrl: message.mediaUrl || '',
        mediaType: message.mediaType || '',
        fileSize: message.fileSize || '',
        fileName: message.fileName || '',
        isPrivate: message.isPrivate,
        action: message.action,
        mediaId: message.mediaId || '',
        uploadedBy: message.uploadedBy || '',
        flaggedUserId: message.flaggedUserId || '',
        flaggedBy: message.flaggedBy || '',
        reason: message.reason || '',
        token: SHARED_TOKEN
      };

      const response = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      return result.ok === true;
    } catch (error) {
      console.error('Google Sheets logging error:', error);
      return false;
    }
  }

  // Log user action to Google Sheets
  async logUserAction(userId: string, action: string, details?: any): Promise<boolean> {
    return this.logMessage({
      timestamp: new Date(),
      messageId: `action_${Date.now()}`,
      senderId: userId,
      chatId: 'system',
      messageType: 'action',
      content: JSON.stringify({ action, details }),
      isPrivate: false,
      action: action
    });
  }

  // Log media upload to Google Sheets
  async logMediaUpload(
    messageId: string, 
    senderId: string, 
    chatId: string, 
    mediaUrl: string, 
    mediaType: string, 
    fileName: string, 
    fileSize: number
  ): Promise<boolean> {
    return this.logMessage({
      timestamp: new Date(),
      messageId,
      senderId,
      chatId,
      messageType: 'media',
      content: `Media upload: ${fileName}`,
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      isPrivate: false,
      action: 'media_upload',
      uploadedBy: senderId
    });
  }

  // Test connection to Google Sheets
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${APPSCRIPT_URL}?mode=ping&token=${SHARED_TOKEN}`);
      const result = await response.json();
      return result.ok === true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export const sheetsService = new GoogleSheetsService();
