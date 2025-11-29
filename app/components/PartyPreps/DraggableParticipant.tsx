"use client";

import { useDraggable } from "@dnd-kit/core";
import { X } from "lucide-react";

interface DraggableParticipantProps {
  participant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  isCurrentUser: boolean;
  onRemove?: () => void;
}

export default function DraggableParticipant({
  participant,
  isCurrentUser,
  onRemove,
}: DraggableParticipantProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: participant.id,
    data: participant,
  });

  return (
    <div className="relative inline-flex">
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-grab active:cursor-grabbing
          ${isDragging ? "opacity-50" : "opacity-100"}
          ${isCurrentUser
            ? "bg-warm-olive text-white hover:bg-cool-olive"
            : "bg-gray-100 text-gray-600"
          }`}
        disabled={!isCurrentUser}
      >
        {participant.firstName} {participant.lastName}
      </button>

      {onRemove && isCurrentUser && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      )}
    </div>
  );
}
