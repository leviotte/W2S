import { useCallback } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store/useStore';
import { Event } from '@/types/event';
import { UserProfile } from '@/lib/store/useStore';

export const useEventMessages = (event: Event | undefined, currentUser: UserProfile | null) => {
  const { updateEvent } = useStore();

  const sendMessage = useCallback(async (text: string, isAnonymous: boolean, gifUrl?: string) => {
    if (!event || !currentUser) return;
    try {
      const messages = Array.isArray(event.messages) ? event.messages : [];
      const message = {
        id: crypto.randomUUID(),
        text,
        userId: currentUser.id,
        userName: isAnonymous ? `Anonymous ${event.name}-fan` : `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: new Date().toISOString(),
        isAnonymous,
        gifUrl
      };
      await updateEvent(event.id, { messages: [...messages, message] });
    } catch {
      toast.error('Failed to send message');
    }
  }, [event, currentUser, updateEvent]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!event) return;
    try {
      const messages = Array.isArray(event.messages) ? event.messages : [];
      const updated = messages.map(msg => msg.id === messageId ? { ...msg, text: newText } : msg);
      await updateEvent(event.id, { messages: updated });
      toast.success('Message edited');
    } catch {
      toast.error('Failed to edit message');
    }
  }, [event, updateEvent]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!event) return;
    try {
      const messages = Array.isArray(event.messages) ? event.messages : [];
      await updateEvent(event.id, { messages: messages.filter(msg => msg.id !== messageId) });
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  }, [event, updateEvent]);

  return { sendMessage, editMessage, deleteMessage };
};
