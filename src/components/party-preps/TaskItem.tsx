// src/components/party-preps/TaskItem.tsx
"use client";

import { useState } from 'react';
import { Check, Trash2, UserPlus, X } from 'lucide-react';
import type { TaskFromFirestore } from '@/types/task'; // ✅ CHANGED
import type { EventParticipant } from '@/types/event';

interface TaskItemProps {
  task: TaskFromFirestore; // ✅ CHANGED from Task
  eventId: string;
  participants: EventParticipant[];
  currentUserId: string;
  isOrganizer: boolean;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAssignParticipant: (taskId: string, participantId: string) => void;
  onRemoveParticipant: (taskId: string, participantId: string) => void;
}

export default function TaskItem({
  task,
  eventId,
  participants,
  currentUserId,
  isOrganizer,
  onToggle,
  onDelete,
  onAssignParticipant,
  onRemoveParticipant,
}: TaskItemProps) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Get assigned participant details
  const assignedParticipants = participants.filter(p =>
    task.assignedParticipants.includes(p.id)
  );

  const isAssignedToCurrentUser = task.assignedParticipants.includes(currentUserId);

  // Available participants to assign (not already assigned)
  const availableParticipants = participants.filter(
    p => !task.assignedParticipants.includes(p.id)
  );

  return (
    <div className="flex items-start space-x-3 p-3 bg-white/30 rounded-lg border border-gray-200">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-warm-olive border-warm-olive'
            : 'border-gray-400 hover:border-warm-olive'
        }`}
      >
        {task.completed && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* Task Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <p
              className={`font-medium ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
          </div>

          {/* Delete Button (only for organizer) */}
          {isOrganizer && onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
              title="Verwijder taak"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Assigned Participants */}
        {assignedParticipants.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {assignedParticipants.map(participant => (
              <div
                key={participant.id}
                className="flex items-center space-x-1 bg-warm-olive/20 text-warm-olive px-2 py-1 rounded-full text-xs"
              >
                <span>
                  {participant.firstName} {participant.lastName}
                </span>
                {(isOrganizer || participant.id === currentUserId) && (
                  <button
                    onClick={() => onRemoveParticipant(task.id, participant.id)}
                    className="hover:text-red-600"
                    title="Verwijder toewijzing"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Assign Button */}
        <div className="relative mt-2">
          <button
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            className="flex items-center space-x-1 text-sm text-warm-olive hover:text-cool-olive"
            disabled={availableParticipants.length === 0}
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {isAssignedToCurrentUser ? 'Voeg anderen toe' : 'Wijs jezelf toe'}
            </span>
          </button>

          {/* Dropdown */}
          {showAssignDropdown && availableParticipants.length > 0 && (
            <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {availableParticipants.map(participant => (
                <button
                  key={participant.id}
                  onClick={() => {
                    onAssignParticipant(task.id, participant.id);
                    setShowAssignDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  {participant.firstName} {participant.lastName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}