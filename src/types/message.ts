// src/types/message.ts
export type Message = {
  id: string;

  userId: string;
  userName: string;

  text?: string;
  gifUrl?: string;

  timestamp: string;
  isAnonymous: boolean;
  edited: boolean;
  read: boolean;

  senderId?: string;
  senderAvatar?: string | null;
  replyTo?: string;
};
