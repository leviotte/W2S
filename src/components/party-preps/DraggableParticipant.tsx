// src/components/party-preps/DraggableParticipant.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { UserAvatar } from "@/components/shared/user-avatar";

interface DraggableParticipantProps {
  id: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  isCurrentUser?: boolean;
}

export default function DraggableParticipant({
  id,
  firstName,
  lastName,
  photoURL,
  isCurrentUser = false,
}: DraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = `${firstName} ${lastName}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex flex-col items-center gap-2 p-3 rounded-lg border-2 
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'border-primary bg-primary/5 shadow-lg scale-105' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
        ${isCurrentUser ? 'ring-2 ring-primary/20' : ''}
      `}
    >
      <UserAvatar
        name={displayName}
        src={photoURL || undefined}
        size="md"
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
        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
          Jij
        </span>
      )}
    </div>
  );
}