// src/components/party-preps/TaskList.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import TaskItem from "./TaskItem";
import type { Task } from "@/types/task";
import type { EventParticipant } from "@/types/event";

interface TaskListProps {
  eventId: string;
  tasks: Task[];
  participants: EventParticipant[];
  currentUserId: string;
  isOrganizer: boolean;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onRemoveParticipant: (taskId: string, participantId: string) => void;
}

export default function TaskList({
  eventId,
  tasks,
  participants,
  currentUserId,
  isOrganizer,
  onToggle,
  onDelete,
  onRemoveParticipant,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nog geen taken toegevoegd.</p>
        {isOrganizer && <p className="text-sm mt-2">Klik op "Voeg Taak Toe" om te beginnen.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          eventId={eventId}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggle={() => onToggle(task.id)}
          onDelete={onDelete ? () => onDelete(task.id) : undefined}
          onRemoveParticipant={(participantId) =>
            onRemoveParticipant(task.id, participantId)
          }
        />
      ))}
    </div>
  );
}