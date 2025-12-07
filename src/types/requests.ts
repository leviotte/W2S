// src/types/requests.ts
import { z } from 'zod';

export const eventRequestSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  userName: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.any(),
});

export type EventRequest = z.infer<typeof eventRequestSchema>;