// src/types/event.ts
import { z } from 'zod';
import { addressSchema } from './address';
import { chatMessageSchema } from './chat';
import { taskSchema } from './task';
import { Timestamp } from 'firebase/firestore';

// Jouw uitstekende timestamp schema (behouden)
const timestampSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) return arg.toDate();
  // ... (rest van je implementatie)
  return arg;
}, z.date({ message: "Ongeldig datumformaat" }));

// Deelnemer schema (behouden)
export const eventParticipantSchema = z.object({
  id: z.string(),
  email: z.string().email("Ongeldig e-mailadres").or(z.literal('')),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  confirmed: z.boolean().default(false),
  wishlistId: z.string().optional(),
  // GOED OM TE HEBBEN: optionele avatar URL
  photoURL: z.string().url().optional().nullable(),
});

// Hoofdschema voor een Evenement (UITGEBREID)
export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  organizerId: z.string(),
  
  date: timestampSchema,
  time: z.string().optional(),
  // --- HIER ZIJN DE FIXES ---
  endTime: z.string().optional(),
  theme: z.string().optional(),
  additionalInfo: z.string().optional(),
  organizerPhone: z.string().optional(),
  organizerEmail: z.string().email().optional(),
  // --------------------------

  registrationDeadline: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastReadTimestamps: z.record(z.string(), timestampSchema).optional(),

  location: z.string().optional(),
  address: addressSchema.optional(),
  isPublic: z.boolean().default(false),
  budget: z.number().positive().optional(),
  maxParticipants: z.number().positive().int().optional(),
  
  participants: z.record(z.string(), eventParticipantSchema).default({}),
  
  isLootjesEvent: z.boolean().default(false),
  namesDrawn: z.boolean().default(false),
  allowDrawingNames: z.boolean().optional().default(false),
  drawnNames: z.record(z.string(), z.string()).optional(),
  exclusions: z.record(z.string(), z.array(z.string())).optional(),

  tasks: z.array(taskSchema).default([]),
  messages: z.array(chatMessageSchema).default([]),
  description: z.string().optional(),
  backgroundImage: z.string().url("Ongeldige URL voor achtergrond").optional().nullable(),
  purchases: z.record(z.string(), z.boolean()).optional(),
  participantCount: z.number().int().optional(),
  allowSelfRegistration: z.boolean().default(false),
  eventComplete: z.boolean().default(false),
  isInvited: z.boolean().optional(),
});

// Afgeleide types
export type Event = z.infer<typeof eventSchema>;
export type EventParticipant = z.infer<typeof eventParticipantSchema>;
export type Participant = EventParticipant;

// Update & Create schema's (behouden)
export const eventUpdateSchema = eventSchema.partial();
export const createEventSchema = eventSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    organizerId: true 
});
export type CreateEventData = z.infer<typeof createEventSchema>;