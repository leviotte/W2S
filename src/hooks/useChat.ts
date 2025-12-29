import { useState, useCallback } from 'react';
import type { Message } from '@/types';

interface UseChatReturn {
  messages: Message[];
  sendMessage: (text: string, userId: string, userName: string, anonymousMode: boolean, gifUrl?: string) => void;
  clearMessages: () => void;
}

export function useChat(initialMessages: Message[] = []): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const sendMessage = useCallback(
    (text: string, userId: string, userName: string, anonymousMode: boolean, gifUrl?: string) => {
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newMessage: Message = {
        id: messageId,
        text: text,
        userId: userId,
        userName: userName,
        timestamp: new Date().toISOString(),
        isAnonymous: anonymousMode,
        edited: false,
        read: false,
        gifUrl: gifUrl,
      };

      setMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
  };
}