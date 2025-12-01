import React, { useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Message } from "@/components/types/chat";
import ChatMessage from "@/components/chat/ChatMessage";
import { shouldShowDate, formatChatDate } from "@/utils/chat";
import LoadingSpinner from "@/components/LoadingSpinner";

interface VirtualizedMessageListProps {
  messages: Message[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading?: boolean;
}

export default function VirtualizedMessageList({
  messages,
  eventId,
  currentUserId,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading
}: VirtualizedMessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const lastMessageRef = useRef<string | null>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageRef.current && 
          (isAtBottomRef.current || lastMessage.userId === currentUserId)) {
        lastMessageRef.current = lastMessage.id;
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth',
          align: 'end'
        });
      }
    }
  }, [messages, currentUserId]);

  const handleScroll = (atBottom: boolean) => {
    isAtBottomRef.current = atBottom;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%', width: '100%' }}
      totalCount={messages.length}
      followOutput="smooth"
      alignToBottom
      atBottomStateChange={handleScroll}
      itemContent={(index) => {
        const message = messages[index];
        const showDate = shouldShowDate(messages, index);

        return (
          <div className="px-4">
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-warm-olive/10 text-warm-olive px-3 py-1 rounded-lg text-sm">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessage
              message={message}
              eventId={eventId}
              isOwnMessage={message.userId === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      }}
      startReached={hasMore ? onLoadMore : undefined}
      initialTopMostItemIndex={messages.length - 1}
      components={{
        Header: hasMore ? () => (
          <div className="flex justify-center p-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : undefined
      }}
    />
  );
}
