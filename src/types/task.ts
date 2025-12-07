// src/types/task.ts
import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string(), 
  title: z.string().min(1, 'Taak titel mag niet leeg zijn.'), // FIX: 'text' -> 'title'
  completed: z.boolean().default(false),
  assignedParticipants: z.array(z.string()).default([]), // FIX: 'assignedTo' -> 'assignedParticipants'
});

export type Task = z.infer<typeof taskSchema>;