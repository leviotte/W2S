import { z } from 'zod';
import { chatMessageSchema } from './chat';

export const eventParticipantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['pending', 'accepted', 'declined']),
});

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Event naam is verplicht'),
  // CORRECTIE: z.coerce.date() gebruiken. De custom 'required_error' laten we vallen
  // ten voordele van de correcte syntax en Zod's default-gedrag.
  date: z.coerce.date(),
  description: z.string().optional(),
  organizerId: z.string().uuid(),
  participants: z.array(eventParticipantSchema).default([]),
  isPublic: z.boolean().default(false),
  hasNameDrawing: z.boolean().default(false),
  drawnNames: z.record(z.string(), z.string()).optional(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  chat: z.array(chatMessageSchema).optional(),
  // CORRECTIE: Ook hier z.coerce.date() gebruiken.
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const createEventSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Event = z.infer<typeof eventSchema>;
export type EventParticipant = z.infer<typeof eventParticipantSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;