/**
 * src/components/chat/VirtualizedMessageList.tsx
 *
 * Gecorrigeerd en verbeterd component voor gevirtualiseerde berichtenlijst.
 * FIX:
 * - 'userId' vervangen door 'senderId' om te matchen met het ChatMessage type.
 * - Kleine syntaxfouten in Virtuoso props (comp -> components, itemC -> itemContent) hersteld.
 * - De naam van het bestand is aangepast om de '.Props' te verwijderen, aangezien dit het component zelf is.
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage } from '@/types';
import { shouldShowDate, formatChatDate } from '@/lib/utils/chat';
import { ChatMessage as ChatMessageComponent } from '@/components/chat/ChatMessage';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
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
  const isAtBottomRef = useRef(true);
  const previousMessageCount = useRef(messages.length);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      messages.length > previousMessageCount.current &&
      // FIX: 'userId' vervangen door 'senderId' om te matchen met het type.
      (isAtBottomRef.current || lastMessage.senderId === currentUserId)
    ) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages, currentUserId]);

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
      data={messages}
      atBottomStateChange={(atBottom) => (isAtBottomRef.current = atBottom)}
      startReached={hasMore ? onLoadMore : undefined}
      followOutput="auto"
      initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
      // FIX: 'comp' gecorrigeerd naar 'components'
      components={{
        Header: () =>
          hasMore ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : null,
      }}
      // FIX: 'itemC' gecorrigeerd naar 'itemContent'
      itemContent={(index, message) => {
        if (!message) return null;

        const showDate = shouldShowDate(messages, index);
        // FIX: 'userId' vervangen door 'senderId' om te matchen met het type.
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <div className="px-4" key={message.id}>
            {showDate && (
              <div className="my-4 flex justify-center">
                <span className="rounded-lg bg-warm-olive/10 px-3 py-1 text-sm text-warm-olive">
                  {/* Deze functie werkt nu correct dankzij de aanpassing in chat.ts */}
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