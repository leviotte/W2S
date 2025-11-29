export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO string voor consistentie in Next.js
  isAnonymous?: boolean;
  gifUrl?: string;
}

export interface ChatState {
  messages: Message[];
  lastReadTimestamp: number; // in ms sinds epoch
  isLoading: boolean;
  error: string | null;
}
