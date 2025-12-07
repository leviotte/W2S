// src/types/chat.ts
import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string().optional(), // Optioneel maken voor flexibiliteit
  senderAvatar: z.string().url().optional().nullable(),
  text: z.string().optional(),
  gif: z.string().url().optional(),
  timestamp: z.any(), // Voor Firestore Timestamps
  isRead: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;