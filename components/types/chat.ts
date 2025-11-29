export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
  isAnonymous?: boolean;
  gifUrl?: string;
}

export interface ChatState {
  messages: Message[];
  lastReadTimestamp: number;
  isLoading: boolean;
  error: string | null;
}
