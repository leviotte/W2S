// src/components/chat/MessageList.tsx
'use client';

import React from 'react';
import type { Message as Message } from '@/types';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { shouldShowDate, formatChatDate } from '@/lib/utils/chat';

interface MessageListProps {
  messages: Message[];
  eventId: string;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export default function MessageList({
  messages,
  eventId,
  currentUserId,
  onEdit,
  onDelete,
}: MessageListProps) {
  
  return (
    <div className="px-4 py-2 space-y-2">
      {messages.map((message, index) => {
        const showDate = shouldShowDate(messages, index);

        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            {/* ✅ FIX: Gebruik gewoon message direct, niet transformedMessage */}
            <ChatMessageComponent
              message={message}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}