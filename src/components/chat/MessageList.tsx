'use client';

import React from 'react';
import type { ChatMessage as Message } from '@/types/chat';
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
        // ✅ FIXED: Use senderId with fallback to userId
        const senderId = message.senderId || message.userId;
        const senderName = message.senderName || message.userName;
        const isOwnMessage = senderId === currentUserId;

        // ✅ FIXED: Transform message to match ChatMessage component props
        const transformedMessage = {
          id: message.id,
          text: message.text,
          gifUrl: message.gifUrl,
          senderId: senderId,
          senderName: senderName,
          senderPhotoURL: message.senderAvatar,
          timestamp: message.timestamp,
          isGif: !!message.gifUrl,
        };

        return (
          <React.Fragment key={message.id}>
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                  {formatChatDate(message.timestamp)}
                </span>
              </div>
            )}
            <ChatMessageComponent
              message={transformedMessage}
              currentUserId={currentUserId}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}