// src/types/task.ts
import { z } from 'zod';

/**
 * ✅ SINGLE SOURCE OF TRUTH voor Tasks (PartyPreps)
 */

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Taak titel mag niet leeg zijn.'),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  assignedParticipants: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type Task = z.infer<typeof taskSchema>;

// Helper functions
export function createTask(title: string, description?: string): Task {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    completed: false,
    assignedParticipants: [],
    createdAt: new Date(),
  };
}

export function toggleTaskComplete(task: Task): Task {
  return { ...task, completed: !task.completed };
}

export function assignParticipant(task: Task, participantId: string): Task {
  if (task.assignedParticipants.includes(participantId)) {
    return task;
  }
  return {
    ...task,
    assignedParticipants: [...task.assignedParticipants, participantId],
  };
}

export function removeParticipant(task: Task, participantId: string): Task {
  return {
    ...task,
    assignedParticipants: task.assignedParticipants.filter(id => id !== participantId),
  };
}