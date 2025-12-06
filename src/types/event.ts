/**
 * src/types/event.ts
 *
 * GEÜPGRADED: Jouw bestaande schema's gecombineerd met de nieuwe Task functionaliteit.
 */
import { z } from 'zod';
import { chatMessageSchema } from './chat'; // We gaan ervan uit dat dit pad correct is.

// STAP 1: Definiëer het schema voor een taak.
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Taak titel mag niet leeg zijn.'),
  completed: z.boolean().default(false),
  // Dit wordt een array van de 'id' van de deelnemers (user/profile IDs).
  assignedParticipants: z.array(z.string()).default([]),
});

// Jouw bestaande, sterke participant schema.
export const eventParticipantSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  confirmed: z.boolean().default(false),
  wishlistId: z.string().nullable().optional(),
});

// STAP 2: Voeg de 'tasks' array toe aan jouw hoofd-event schema.
export const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Event naam is verplicht'),
  date: z.coerce.date(),
  description: z.string().optional(),
  organizerId: z.string(),
  participants: z.record(z.string(), eventParticipantSchema),
  isPublic: z.boolean().default(false),
  hasNameDrawing: z.boolean().default(false),
  drawnNames: z.record(z.string(), z.string()).optional(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  chat: z.array(chatMessageSchema).optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
  
  // ----- HIER IS DE UPGRADE -----
  tasks: z.array(taskSchema).optional().default([]), // .default([]) is een goede practice.
});

// Afgeleide types worden automatisch correct bijgewerkt.
export const createEventSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Exporteer alle types die we in de app nodig hebben.
export type Task = z.infer<typeof taskSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventParticipant = z.infer<typeof eventParticipantSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;