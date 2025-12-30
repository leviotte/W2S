// src/hooks/useEventMessages.ts
'use client';

import { useState, useCallback } from 'react';
import type { EventMessage } from '@/types/event';
import type { Message } from '@/types';

export function useEventMessages(initialMessages: EventMessage[] = [], currentUserId?: string, currentUserName?: string) {
  // ✅ map initial EventMessage[] → Message[]
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      userId: m.senderId,
      userName: currentUserName ?? 'Unknown User',
      timestamp: m.timestamp ?? new Date().toISOString(),
      text: m.content ?? '',
      isAnonymous: false,
      edited: false,
      read: false,
      gifUrl: undefined,
      senderId: m.senderId,
      replyTo: undefined,
    }))
  );

  const sendMessage = useCallback(
    async (text: string, isAnonymous: boolean, gifUrl?: string) => {
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newMessage: Message = {
        id: messageId,
        userId: currentUserId ?? 'unknown',
        userName: currentUserName ?? 'Unknown User',
        timestamp: new Date().toISOString(),
        text,
        isAnonymous,
        edited: false,
        read: false,
        gifUrl,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [currentUserId, currentUserName]
  );

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, text: newText, edited: true } : msg))
    );
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    clearMessages,
  };
}
export function mapEventMessagesToMessages(
  messages: EventMessage[] | undefined,
  currentUserId?: string,
  currentUserName?: string
): Message[] {
  if (!messages) return [];
  return messages.map((m) => ({
    id: m.id,
    userId: m.senderId,
    userName: currentUserName ?? 'Unknown User',
    timestamp: m.timestamp ?? new Date().toISOString(),
    text: m.content ?? '',
    isAnonymous: false,
    edited: false,
    read: false,
    gifUrl: undefined,
    senderId: m.senderId,
    replyTo: undefined,
  }));
}
