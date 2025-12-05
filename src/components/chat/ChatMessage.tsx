'use client';

import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '@/components/shared/user-avatar'; // Pad gecorrigeerd naar onze doelstructuur
import type { ChatMessage as ChatMessageType } from '@/types'; // CORRECTIE: Gebruik ons centrale ChatMessage type
import { getPseudonymForUser } from '@/lib/utils/pseudonyms';
import { cn } from '@/lib/utils'; // Importeren van onze shadcn utility voor classnames

interface ChatMessageProps {
  message: ChatMessageType;
  eventId: string;
  isOwnMessage: boolean;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

// OPLOSSING: Veranderd van 'export default' naar een benoemde 'export const'
export const ChatMessage = ({
  message,
  eventId,
  isOwnMessage,
  onEdit,
  onDelete,
}: ChatMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = async () => {
    if (!onEdit || !editText.trim()) return;
    try {
      await onEdit(message.id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Bericht bijwerken mislukt:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };
  
  const displayName =
    message.isAnonymous && message.pseudonym
      ? message.pseudonym
      : message.userName;

  return (
    <div
      className={cn(
        'group mb-2 flex items-end space-x-2',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
      // FOUTFIX: Dit zijn de correcte event handlers voor hover
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isOwnMessage && <UserAvatar userName={message.userName} size="sm" />}
      
      <div className={cn('flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
        <span className="px-2 pb-1 text-xs text-muted-foreground">{displayName}</span>
        
        <div className="relative flex items-center">
            {isOwnMessage && !isEditing && (
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="mr-2 flex items-center space-x-1"
                  >
                    {!message.gifUrl && onEdit && (
                      <button type="button" onClick={() => setIsEditing(true)} className="rounded-full bg-background p-1.5 text-muted-foreground shadow-sm hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(message.id)} className="rounded-full bg-background p-1.5 text-red-500 shadow-sm hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <div
                className={cn(
                'max-w-xs overflow-hidden rounded-lg p-3 shadow-md break-words md:max-w-md',
                isOwnMessage
                    ? 'rounded-br-none bg-primary text-primary-foreground'
                    : 'rounded-bl-none bg-muted'
                )}
            >
                {isEditing ? (
                <div className="flex flex-col space-y-2">
                    <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full resize-none rounded-md border bg-background p-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    rows={Math.min(5, editText.split('\n').length)}
                    autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                    <button type="button" onClick={handleEdit} className="flex items-center space-x-1 rounded-md bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
                        <Check className="h-4 w-4" />
                        <span>Opslaan</span>
                    </button>
                    <button type="button" onClick={handleCancelEdit} className="flex items-center space-x-1 rounded-md bg-secondary px-3 py-1 text-secondary-foreground hover:bg-secondary/90">
                        <X className="h-4 w-4" />
                        <span>Annuleer</span>
                    </button>
                    </div>
                </div>
                ) : (
                <>
                    {message.gifUrl ? (
                    <img
                        src={message.gifUrl}
                        alt="GIF"
                        className="max-w-full rounded-md"
                        loading="lazy"
                    />
                    ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};