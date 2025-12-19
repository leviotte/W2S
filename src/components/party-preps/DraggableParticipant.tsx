// src/components/party-preps/DraggableParticipant.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';

interface DraggableParticipantProps {
  id: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  isCurrentUser?: boolean;
  onRemove?: () => void;
  compact?: boolean; // Voor verschillende display modes
}

export default function DraggableParticipant({
  id,
  firstName,
  lastName,
  photoURL,
  isCurrentUser = false,
  onRemove,
  compact = false,
}: DraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { id, firstName, lastName, photoURL },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = `${firstName} ${lastName}`;

  // Compact mode (zoals in oude versie - voor task assignments)
  if (compact) {
    return (
      <div className="relative inline-flex">
        <button
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-grab active:cursor-grabbing
            ${isDragging ? 'shadow-lg scale-105' : ''}
            ${isCurrentUser 
              ? 'bg-warm-olive text-white hover:bg-cool-olive' 
              : 'bg-gray-100 text-gray-600'
            }`}
          disabled={!isCurrentUser}
        >
          {firstName} {lastName}
        </button>
        {onRemove && isCurrentUser && (
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100 z-10"
            type="button"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </div>
    );
  }

  // Full card mode (nieuwe versie - voor participant list)
  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`
          flex flex-col items-center gap-2 p-3 rounded-lg border-2 
          transition-all duration-200 cursor-grab active:cursor-grabbing
          ${isDragging 
            ? 'border-warm-olive bg-warm-olive/5 shadow-lg scale-105' 
            : 'border-gray-200 hover:border-warm-olive/50 hover:bg-gray-50'
          }
          ${isCurrentUser ? 'ring-2 ring-warm-olive/20' : ''}
        `}
      >
        <UserAvatar
          profile={{ displayName, photoURL }}
          className="h-12 w-12"
        />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
            {firstName}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-[100px]">
            {lastName}
          </p>
        </div>
        {isCurrentUser && (
          <span className="text-xs px-2 py-0.5 bg-warm-olive/10 text-warm-olive rounded-full font-medium">
            Jij
          </span>
        )}
      </div>
      
      {onRemove && isCurrentUser && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10 border border-gray-200"
          type="button"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      )}
    </div>
  );
}