/**
 * src/lib/utils/chat.ts
 *
 * Gecombineerde en verbeterde helper-functies voor de chat.
 *
 * FIX:
 * - `formatChatDate` accepteert nu `Date | string | number` om type-errors te voorkomen.
 * - `shouldShowDate` logica verbeterd om te tonen na een pauze (bv. 30min), niet enkel op een nieuwe dag.
 * - `getUnreadMessageCount` gecorrigeerd om `senderId` te gebruiken i.p.v. het verouderde `userId`.
 */
import type { ChatMessage } from '@/types';

/**
 * Bepaalt of de datum getoond moet worden boven een bericht.
 * Verbeterde logica: Toont datum als het de eerste boodschap is, of als er meer dan
 * 30 minuten tussen dit en het vorige bericht zit voor context.
 */
export function shouldShowDate(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;

  const currentMessage = messages[index];
  const prevMessage = messages[index - 1];

  // Guard clause voor robuustheid
  if (!currentMessage?.timestamp || !prevMessage?.timestamp) return false;

  // Maak Date objecten aan (werkt met Date, string, of number)
  const currentTimestamp = new Date(currentMessage.timestamp);
  const prevTimestamp = new Date(prevMessage.timestamp);
  
  // Bereken verschil in minuten
  const diffInMinutes = (currentTimestamp.getTime() - prevTimestamp.getTime()) / (1000 * 60);

  return diffInMinutes > 30;
}

/**
 * Formatteert een timestamp voor weergave in de chat.
 * Accepteert Date, string, of number voor maximale flexibiliteit.
 */
export function formatChatDate(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Vandaag';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Gisteren';
  }
  return date.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Berekent het aantal ongelezen berichten voor een specifieke gebruiker.
 * @param messages - De volledige lijst van chatberichten.
 * @param currentUserId - De ID van de huidige gebruiker.
 * @param lastReadTimestamp - De timestamp (als getal) van wanneer de gebruiker voor het laatst heeft gelezen.
 * @returns Het aantal ongelezen berichten.
 */
export const getUnreadMessageCount = (
  messages: ChatMessage[],
  currentUserId: string,
  lastReadTimestamp: number,
): number => {
  return messages.filter(
    (msg) =>
      new Date(msg.timestamp).getTime() > lastReadTimestamp &&
      // FIX: Gebruik 'senderId' zoals gedefinieerd in het ChatMessage type
      msg.senderId !== currentUserId 
  ).length;
};