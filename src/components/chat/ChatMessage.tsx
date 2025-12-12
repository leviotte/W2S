'use client';

import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    text?: string; // ✅ FIXED: Made optional
    gifUrl?: string; // ✅ ADDED: For GIF support
    senderId: string;
    senderName: string;
    senderPhotoURL?: string | null;
    timestamp: Date | { toDate: () => Date };
    isGif?: boolean;
  };
  currentUserId: string;
  className?: string;
}

export function ChatMessage({ message, currentUserId, className }: ChatMessageProps) {
  const isOwnMessage = message.senderId === currentUserId;
  
  const messageTime = message.timestamp instanceof Date 
    ? message.timestamp 
    : message.timestamp.toDate();

  const avatarUser = {
    displayName: message.senderName,
    photoURL: message.senderPhotoURL,
  };

  // ✅ FIXED: Support both text and GIF messages
  const messageContent = message.isGif || message.gifUrl 
    ? message.gifUrl || message.text 
    : message.text;

  return (
    <div
      className={cn(
        'flex items-start gap-3 mb-4',
        isOwnMessage && 'flex-row-reverse',
        className
      )}
    >
      {!isOwnMessage && <UserAvatar profile={avatarUser} className="h-8 w-8" />}

      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isOwnMessage && 'items-end'
        )}
      >
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.senderName}
          </span>
        )}

        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {message.isGif || message.gifUrl ? (
            <img
              src={messageContent}
              alt="GIF"
              className="max-w-xs rounded-md"
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {messageContent || ''}
            </p>
          )}
        </div>

        <span className="text-xs text-muted-foreground mt-1">
          {format(messageTime, 'HH:mm', { locale: nl })}
        </span>
      </div>
    </div>
  );
}