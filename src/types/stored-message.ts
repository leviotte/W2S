// src/types/stored-message.ts
export type StoredMessage = {
  id: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO
  eventId?: string;
  replyTo?: string;
};
