// src/lib/messages/map-message.ts
import type { Message } from '@/types/message';
import type { StoredMessage } from '@/types/stored-message';
export function mapStoredMessageToMessage(
  stored: StoredMessage,
  options?: {
    userName?: string;
    isAnonymous?: boolean;
  }
): Message {
  return {
    id: stored.id,

    userId: stored.senderId,
    senderId: stored.senderId,
    userName: options?.userName ?? 'Onbekend',

    text: stored.content,
    timestamp: stored.timestamp,

    isAnonymous: options?.isAnonymous ?? false,
    edited: false,
    read: false,
  };
}
