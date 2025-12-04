// Path suggestion for Next.js 16 repo:
// Place this file at: src/lib/types/chat.ts

// Next.js 16 ready, server-safe, Firebase-independent chat types
// Avoid direct imports from firebase/firestore to keep code fully SSR-compatible.
// Timestamps are normalized to ISO strings for portability across server and client.

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  // ISO 8601 timestamp for SSR, Edge, RSC compatibility
  timestamp: string;
  isAnonymous?: boolean;
  gifUrl?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  lastReadTimestamp: number;
  isLoading: boolean;
  error: string | null;
}

// Utility helpers for converting dates safely
export const createTimestamp = (date: Date | number): string => {
  return new Date(date).toISOString();
};

export const nowTimestamp = (): string => new Date().toISOString();
