import { z } from 'zod';

// ============================================================================
// CHAT MESSAGE SCHEMA
// ============================================================================

export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  timestamp: z.string(),
  isAnonymous: z.boolean(),
  edited: z.boolean().optional().default(false),
  text: z.string().optional(),
  gifUrl: z.string().optional(),
  senderId: z.string().optional(),
  senderName: z.string().optional(),
  senderAvatar: z.string().nullable().optional(),
  gif: z.string().optional(),
  eventId: z.string().optional(),
  read: z.boolean().optional().default(false),
  replyTo: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// ============================================================================
// CHAT MESSAGE INPUT (voor nieuwe berichten)
// ============================================================================

export interface ChatMessageInput {
  userId: string;
  userName: string;
  text?: string;
  gifUrl?: string;
  isAnonymous: boolean;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  gif?: string;
}

/**
 * ✅ FIXED: Convert input to ChatMessage format
 */
export function toChatMessage(input: ChatMessageInput): Omit<ChatMessage, 'id' | 'timestamp'> {
  return {
    userId: input.userId,
    userName: input.userName,
    text: input.text,
    gifUrl: input.gifUrl,
    isAnonymous: input.isAnonymous,
    edited: false, // ✅ TOEGEVOEGD
    senderId: input.senderId,
    senderName: input.senderName,
    senderAvatar: input.senderAvatar,
    gif: input.gif,
  };
}