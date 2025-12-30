// src/components/chat/ChatMessage.tsx
'use client';

import { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale';

import type { Message as ChatMessageType } from '@/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
  currentUserId: string;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export function ChatMessage({
  message,
  currentUserId,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const isOwnMessage = message.userId === currentUserId || message.senderId === currentUserId;
  const displayName = message.isAnonymous ? 'Anoniem' : message.userName;

  const handleSaveEdit = async () => {
    if (!onEdit || !editText.trim()) return;
    
    try {
      await onEdit(message.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) {
      try {
        await onDelete(message.id);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const messageTime = new Date(message.timestamp);

  const avatarUser = {
    displayName: message.isAnonymous ? 'Anoniem' : displayName,
    photoURL: message.isAnonymous ? null : message.senderAvatar || null,
  };

  const messageContent = message.gifUrl || message.text || '';

  return (
    <div
      className={cn(
        'flex items-start gap-3 mb-4 group',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {!isOwnMessage && (
        <UserAvatar profile={avatarUser} className="h-8 w-8 flex-shrink-0" />
      )}

      <div
        className={cn(
          'flex flex-col max-w-[70%] relative',
          isOwnMessage && 'items-end'
        )}
      >
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 font-medium">
            {displayName}
          </span>
        )}

        {isEditing ? (
          <div className="space-y-2 w-full">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-0 focus:border-warm-olive resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} className="bg-warm-olive hover:bg-cool-olive">
                Opslaan
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(message.text || '');
                }}
              >
                Annuleren
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2 shadow-sm',
              isOwnMessage
                ? 'bg-warm-olive text-white'
                : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200'
            )}
          >
            {message.gifUrl ? (
              <img
                src={messageContent}
                alt="GIF"
                className="rounded-lg max-w-[250px] h-auto"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {messageContent}
                {message.edited && (
                  <span className={cn(
                    'text-xs ml-2 italic',
                    isOwnMessage ? 'text-warm-beige/70' : 'text-gray-500'
                  )}>
                    (bewerkt)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <span className={cn(
          'text-xs mt-1',
          isOwnMessage ? 'text-gray-600' : 'text-gray-500'
        )}>
          {format(messageTime, 'HH:mm', { locale: nlBE })}
        </span>

        {isOwnMessage && !isEditing && (onEdit || onDelete) && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && message.text && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bewerken
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
