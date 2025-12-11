import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat';

export function useEventMessages(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const sendMessage = useCallback(
    (text: string, userId: string, userName: string, anonymousMode: boolean, gifUrl?: string) => {
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message: ChatMessage = {
        id: messageId,
        text: text,
        userId: userId,
        userName: userName,
        timestamp: new Date().toISOString(),
        isAnonymous: anonymousMode,
        edited: false, // ✅ TOEGEVOEGD
        gifUrl: gifUrl,
      };

      setMessages((prev) => [...prev, message]);
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