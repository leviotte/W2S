/**
 * src/components/chat/ChatMessage.tsx
 *
 * Toont een individueel chatbericht met opties voor bewerken en verwijderen.
 * Dit is een Client Component.
 *
 * VERBETERINGEN:
 * - Alle property-namen zijn gecorrigeerd naar de gestandaardiseerde `ChatMessage` type (bv. `gifUrl` -> `gif`).
 * - JSX syntax voor event handlers (onClick, onMouseEnter) is gecorrigeerd.
 * - De logica voor het tonen van een pseudoniem gebruikt nu de `getPseudonym` utility functie.
 * - State initialisatie voor `editText` is robuust gemaakt met een fallback (`|| ''`).
 * - Styling is verfijnd om beter aan te sluiten bij een modern UI-systeem.
 */

'use client';

import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '../shared/user-avatar';
import type { ChatMessage as ChatMessageType } from '@/types';
import { getPseudonym } from '@/lib/utils/pseudonyms';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nlBE } from 'date-fns/locale';

interface ChatMessageProps {
  message: ChatMessageType;
  eventId: string;
  isOwnMessage: boolean;
  onEdit?: (messageId: string, newText: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
}

export const ChatMessage = ({
  message,
  eventId,
  isOwnMessage,
  onEdit,
  onDelete,
}: ChatMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // FIX: Zorg ervoor dat de state altijd een string is, nooit undefined.
  const [editText, setEditText] = useState(message.text || '');
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = async () => {
    if (!onEdit || !editText.trim()) return;
    try {
      await onEdit(message.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Bericht bijwerken mislukt:", error);
      // Optioneel: toon een toast-notificatie aan de gebruiker
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text || '');
  };

  // VERBETERING: Genereer het pseudoniem on-the-fly als dat nodig is.
  const displayName = message.isAnonymous
    ? getPseudonym(message.senderId, eventId)
    : message.senderName || "Onbekende Gebruiker";

  // VERBETERING: Toon een relatieve tijd voor recente berichten.
  const timestampDisplay = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    locale: nlBE,
  });

  return (
    <div
      className={cn(
        'group relative flex items-start space-x-3 py-1',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
      // FIX: Correcte JSX syntax voor event handlers.
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar tonen als het niet je eigen bericht is */}
      {!isOwnMessage && <UserAvatar name={displayName} src={message.senderAvatar} />}
      
      <div className={cn('flex flex-col max-w-sm md:max-w-md', isOwnMessage ? 'items-end' : 'items-start')}>
        {/* De 'bubble' met de inhoud */}
        <div
            className={cn(
            'relative overflow-hidden rounded-xl p-3 shadow-sm break-words',
            isOwnMessage
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm bg-card text-card-foreground'
            )}
        >
            {/* Header in de bubble voor anonieme/normale naam */}
            {!isOwnMessage && (
                 <p className="pb-1 text-xs font-semibold text-primary">{displayName}</p>
            )}

            {isEditing ? (
            <div className="flex flex-col space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full min-h-[60px] resize-none rounded-md border bg-background p-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  {/* FIX: onClick handlers correct toegewezen */}
                  <button type="button" onClick={handleCancelEdit} className="px-3 py-1 text-xs rounded-md hover:bg-muted">Annuleer</button>
                  <button type="button" onClick={handleEdit} className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Opslaan</button>
                </div>
            </div>
            ) : (
            <>
                {/* FIX: Gebruik `message.gif` i.p.v. `message.gifUrl` */}
                {message.gif ? (
                <img
                    src={message.gif}
                    alt="GIF"
                    className="max-w-full rounded-md"
                    loading="lazy"
                />
                ) : (
                <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                )}
            </>
            )}
        </div>
        {/* Tijdstempel onder de bubble */}
        <span className="px-2 pt-1 text-xs text-muted-foreground">{timestampDisplay}</span>
      </div>

      {/* Actieknoppen voor eigen berichten */}
      {isOwnMessage && !isEditing && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pr-2 flex items-center space-x-1"
            >
              {/* FIX: Gebruik `message.gif` en correcte onClick */}
              {!message.gif && onEdit && (
                <button type="button" onClick={() => setIsEditing(true)} className="rounded-full bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground">
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => onDelete(message.id)} className="rounded-full bg-card p-1.5 text-destructive shadow-sm hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};