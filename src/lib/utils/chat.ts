// src/lib/utils/chat.ts
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { nlBE } from 'date-fns/locale';
import type { ChatMessage } from '@/types/chat';

/**
 * Check if date separator should be shown
 */
export function shouldShowDate(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;

  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];

  const currentDate = typeof currentMessage.timestamp === 'string'
    ? new Date(currentMessage.timestamp)
    : currentMessage.timestamp;

  const previousDate = typeof previousMessage.timestamp === 'string'
    ? new Date(previousMessage.timestamp)
    : previousMessage.timestamp;

  return !isSameDay(currentDate, previousDate);
}

/**
 * Format chat date for display
 */
export function formatChatDate(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isToday(date)) {
    return 'Vandaag';
  }

  if (isYesterday(date)) {
    return 'Gisteren';
  }

  return format(date, 'EEEE d MMMM', { locale: nlBE });
}