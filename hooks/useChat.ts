import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Event } from '@/types/event';
import { Message } from '@/types/chat';
import { toast } from 'react-toastify';

export const useChat = (event: Event | undefined, currentUserId: string) => {
  const { updateEvent } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const updateLastRead = useCallback(async () => {
    if (!event) return;
    try {
      const lastReadTimestamps = {
        ...event.lastReadTimestamps,
        [currentUserId]: Date.now()
      };
      await updateEvent(event.id, { lastReadTimestamps });
    } catch (err) {
      console.error('Failed to update lastRead:', err);
    }
  }, [event, currentUserId, updateEvent]);

  useEffect(() => {
    updateLastRead();
  }, [event?.messages?.length, updateLastRead]);

  const sendMessage = useCallback(async (text: string, isAnonymous: boolean, gifUrl?: string) => {
    if (!event) return;
    setIsLoading(true);
    try {
      const messages: Message[] = Array.isArray(event.messages) ? event.messages : [];
      const newMessage: Message = {
        id: crypto.randomUUID(),
        text,
        userId: currentUserId,
        userName: isAnonymous
          ? `Anonymous ${event.name}-fan`
          : `${event.participants[currentUserId]?.firstName || ''} ${event.participants[currentUserId]?.lastName || ''}`,
        timestamp: new Date().toISOString(),
        isAnonymous,
        gifUrl
      };
      await updateEvent(event.id, { messages: [...messages, newMessage] });
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [event, currentUserId, updateEvent]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!event) return;
    setIsLoading(true);
    try {
      const messages: Message[] = Array.isArray(event.messages) ? event.messages : [];
      const updatedMessages = messages.map(msg => msg.id === messageId ? { ...msg, text: newText } : msg);
      await updateEvent(event.id, { messages: updatedMessages });
      toast.success('Message edited');
    } catch (err) {
      toast.error('Failed to edit message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [event, updateEvent]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!event) return;
    setIsLoading(true);
    try {
      const messages: Message[] = Array.isArray(event.messages) ? event.messages : [];
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      await updateEvent(event.id, { messages: updatedMessages });
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [event, updateEvent]);

  return { isLoading, sendMessage, editMessage, deleteMessage, updateLastRead };
};
