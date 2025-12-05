'use client';

import React, { useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

// OPLOSSING 1: Gebruik de correcte typenaam 'ChatMessage'
// OPLOSSING 2: Importeer via de barrel file '@/types' voor consistentie
import type { ChatMessage } from '@/types';
import { shouldShowDate, formatChatDate } from '@/lib/utils/chat';
import { ChatMessage as ChatMessageComponent } from '@/components/chat/ChatMessage'; // Hernoemd voor duidelijkheid
import LoadingSpinner from "@/components/LoadingSpinner";

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId:string) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
}

export function VirtualizedMessageList({
  messages,
  eventId,
  currentUserId,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading,
}: VirtualizedMessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Verbetering: Houd de scroll-positie en auto-scroll logica gescheiden
  const isAtBottomRef = useRef(true);
  const previousMessageCount = useRef(messages.length);

  useEffect(() => {
    // Auto-scroll naar beneden voor nieuwe berichten
    // 1. Als de gebruiker al onderaan was
    // 2. Of als de gebruiker zelf een bericht heeft gestuurd
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      messages.length > previousMessageCount.current &&
      (isAtBottomRef.current || lastMessage.userId === currentUserId)
    ) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages, currentUserId]);
  
  // Verbetering: toon de laad-spinner BOVEN de lijst, niet ipv de lijst.
  // Dit voorkomt dat de lijst verdwijnt bij het laden van oudere berichten.
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%', width: '100%' }}
      data={messages} // Virtuoso's 'data' prop is efficiënter dan 'totalCount' + 'itemContent'
      atBottomStateChange={(atBottom) => (isAtBottomRef.current = atBottom)}
      startReached={hasMore ? onLoadMore : undefined}
      followOutput="auto"
      initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
      components={{
        Header: () =>
          hasMore ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : null,
      }}
      itemContent={(index, message) => {
        // De 'message' is nu direct beschikbaar via de itemContent callback
        if (!message) return null; // Guard clause

        const showDate = shouldShowDate(messages, index);
        const isOwnMessage = message.userId === currentUserId;

        return (
          <div className="px-4">
            {showDate && (
              <div className="my-4 flex justify-center">
                <span className="rounded-lg bg-warm-olive/10 px-3 py-1 text-sm text-warm-olive">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessageComponent
              message={message}
              eventId={eventId}
              isOwnMessage={isOwnMessage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      }}
    />
  );
}