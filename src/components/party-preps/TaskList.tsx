// src/components/party-preps/TaskList.tsx
"use client";

import TaskItem from './TaskItem';
import type { TaskFromFirestore } from '@/types/task'; // ✅ CHANGED
import type { EventParticipant } from '@/types/event';

interface TaskListProps {
  tasks: TaskFromFirestore[]; // ✅ CHANGED from Task[]
  eventId: string;
  participants: EventParticipant[];
  currentUserId: string;
  isOrganizer: boolean;
  onToggleTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAssignParticipant: (taskId: string, participantId: string) => void;
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
  onAssignParticipant,
  onRemoveParticipant,
}: TaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          eventId={eventId}
          participants={participants}
          currentUserId={currentUserId}
          isOrganizer={isOrganizer}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onAssignParticipant={onAssignParticipant}
          onRemoveParticipant={onRemoveParticipant}
        />
      ))}
    </div>
  );
}