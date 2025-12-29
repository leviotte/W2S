// src/hooks/useEventMessages.ts
'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/types';

export function useEventMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const sendMessage = useCallback(
    (text: string, userId: string, userName: string, anonymousMode: boolean, gifUrl?: string) => {
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message: Message = {
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

      setMessages((prev) => [...prev, message]);
    },
    []
  );

  // ✅ ADD: editMessage function
  const editMessage = useCallback(async (messageId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, text: newText, edited: true }
          : msg
      )
    );
  }, []);

  // ✅ ADD: deleteMessage function
  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    editMessage,    // ✅ NOW EXPORTED
    deleteMessage,  // ✅ NOW EXPORTED
    clearMessages,
  };
}