'use client';

import React, { useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage } from '@/types/chat';
import { shouldShowDate, formatChatDate } from '@/lib/utils/chat';
import { ChatMessage as ChatMessageComponent } from '@/components/chat/ChatMessage';
import { LoadingSpinner } from '../ui/loading-spinner';

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
      (isAtBottomRef.current || (lastMessage.senderId || lastMessage.userId) === currentUserId)
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
      components={{
        Header: () =>
          hasMore ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : null,
      }}
      itemContent={(index, message) => {
        if (!message) return null;

        const showDate = shouldShowDate(messages, index);
        const senderId = message.senderId || message.userId;
        const senderName = message.senderName || message.userName;
        const isOwnMessage = senderId === currentUserId;

        // ✅ FIXED: Convert timestamp string to Date
        const timestamp = typeof message.timestamp === 'string' 
          ? new Date(message.timestamp)
          : message.timestamp;

        const transformedMessage = {
          id: message.id,
          text: message.text,
          gifUrl: message.gifUrl,
          senderId: senderId,
          senderName: senderName,
          senderPhotoURL: message.senderAvatar,
          timestamp: timestamp, // ✅ Now a Date object
          isGif: !!message.gifUrl,
        };

        return (
          <div className="px-4" key={message.id}>
            {showDate && (
              <div className="my-4 flex justify-center">
                <span className="rounded-lg bg-warm-olive/10 px-3 py-1 text-sm text-warm-olive">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessageComponent
              message={transformedMessage}
              currentUserId={currentUserId}
            />
          </div>
        );
      }}
    />
  );
}