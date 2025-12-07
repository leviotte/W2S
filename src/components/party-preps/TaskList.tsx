// src/components/party-preps/TaskList.tsx
// GOUDSTANDAARD VERSIE: Gebruikt nu centrale, geïmporteerde types.

"use client";

import TaskItem from "./TaskItem";
// STAP 1: Importeer de types van onze "Single Source of Truth"
import type { Task } from "@/types/task";
import type { EventParticipant } from "@/types/event";

interface TaskListProps {
  // STAP 2: Vervang de inline types door de geïmporteerde types
  tasks: Task[];
  eventId: string;
  participants: EventParticipant[]; // Aanname: dit is de structuur die je doorgeeft
  currentUserId: string;
  isOrganizer: boolean;
  onToggleTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onRemoveParticipant: (taskId: string, participantId: string) => void;
}

export default function TaskList({
  tasks,
  eventId,
  participants,
  currentUserId,
  isOrganizer,
  onToggleTask,
  onDeleteTask,
  onRemoveParticipant,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          eventId={eventId}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          // CORRECTIE: De props moeten correct doorgegeven worden
          onToggle={() => onToggleTask(task.id)}
          onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
          onRemoveParticipant={(participantId) => onRemoveParticipant(task.id, participantId)}
        />
      ))}
    </div>
  );
}