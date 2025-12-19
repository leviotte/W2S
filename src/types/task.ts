// src/types/task.ts
import { z } from 'zod';
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * ✅ FLEXIBLE Task Schema - Accepteert Date, ISO string, EN Firestore Timestamp
 */

// Base schema voor client-side gebruik
export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Taak titel mag niet leeg zijn.'),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  assignedParticipants: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type Task = z.infer<typeof taskSchema>;

/**
 * ✅ FLEXIBLE TYPES voor verschillende use cases
 */

// Voor Firestore data (komt binnen met Timestamp)
export type TaskFromFirestore = Omit<Task, 'createdAt'> & {
  createdAt: Date | string | Timestamp | { toDate: () => Date };
};

// Voor serialized data (ISO strings)
export type TaskSerialized = Omit<Task, 'createdAt'> & {
  createdAt: string;
};

// Voor client-side creatie (Date objects)
export type TaskClient = Task;

/**
 * ✅ HELPERS
 */

export function createTask(title: string, description?: string): TaskClient {
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

/**
 * ✅ CONVERSION HELPERS
 */

// Convert Firestore Timestamp to ISO string
export function serializeTask(task: TaskFromFirestore): TaskSerialized {
  const createdAt = 
    task.createdAt instanceof Date 
      ? task.createdAt.toISOString()
      : typeof task.createdAt === 'string'
      ? task.createdAt
      : typeof task.createdAt === 'object' && task.createdAt !== null && 'toDate' in task.createdAt
      ? task.createdAt.toDate().toISOString()
      : new Date().toISOString();

  return {
    ...task,
    createdAt,
  };
}

// Convert ISO string back to Date
export function deserializeTask(task: TaskSerialized): TaskClient {
  return {
    ...task,
    createdAt: new Date(task.createdAt),
  };
}