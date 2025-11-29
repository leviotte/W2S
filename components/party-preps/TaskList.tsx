"use client";

import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    assignedParticipants: string[];
  }>;
  eventId: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
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
          onToggle={() => onToggleTask(task.id)}
          onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
          onRemoveParticipant={(participantId) => onRemoveParticipant(task.id, participantId)}
        />
      ))}
    </div>
  );
}
