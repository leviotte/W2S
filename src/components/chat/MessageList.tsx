/**
 * src/components/chat/MessageList.tsx
 *
 * Rendert een lijst van chatberichten. Dit is een Client Component.
 *
 * VERBETERINGEN:
 * - "use client"; directive toegevoegd.
 * - Import gecorrigeerd: importeert nu `ChatMessage` uit de centrale types.
 * - Type van de 'messages' prop aangepast naar `ChatMessage[]`.
 * - Logica voor `isOwnMessage` gebruikt nu `senderId` i.p.v. het verouderde `userId`.
 * - Foutieve prop-spreading syntax (`{onEdit}`) gecorrigeerd naar correcte JSX-syntax (`onEdit={onEdit}`).
 */

"use client";

import React from 'react';
// FIX: Importeer het juiste type `ChatMessage` vanuit de centrale type-definitie
import type { ChatMessage as Message } from '@/types'; 
import { ChatMessage as ChatMessageComponent } from './ChatMessage'; // Geef de component een alias
import { shouldShowDate, formatChatDate } from '@/lib/utils/chat';

interface MessageListProps {
  // FIX: Gebruik het correcte, geïmporteerde type
  messages: Message[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId:string) => Promise<void>;
}

export default function MessageList({
  messages,
  eventId,
  currentUserId,
  onEdit,
  onDelete,
}: MessageListProps) {
  
  return (
    // We gebruiken hier een padding en geen margin, zodat de scrollbar de rand raakt.
    <div className="px-4 py-2 space-y-2">
      {messages.map((message, index) => {
        const showDate = shouldShowDate(messages, index);
        // FIX: Gebruik `senderId` voor de vergelijking, zoals gedefinieerd in ons type.
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                  {/* De format functie verwacht een Date, string of number, dus dit werkt perfect. */}
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessageComponent
              message={message}
              eventId={eventId}
              isOwnMessage={isOwnMessage}
              // FIX: Correcte JSX-syntax voor het doorgeven van props
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}