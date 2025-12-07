// src/types/event.ts
import { z } from 'zod';
import { addressSchema } from './user';
import { chatMessageSchema } from './chat';
import { taskSchema } from './task';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// GOUDSTANDAARD VERBETERING: Custom Schema voor Firebase Timestamps
// ============================================================================
const timestampSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  if (arg instanceof Date) {
    return arg;
  }
  if (typeof arg === "string" || typeof arg === "number") {
    const date = new Date(arg);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return arg;
}, z.date({
  // CORRECTIE: z.date() gebruikt 'message' voor de invalid_type error,
  // en niet 'invalid_type_error' of 'required_error'.
  message: "Ongeldig datumformaat",
}));


// ============================================================================
// Schema voor een Deelnemer
// ============================================================================
export const eventParticipantSchema = z.object({
  id: z.string(),
  email: z.string().email("Ongeldig e-mailadres"),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  confirmed: z.boolean().default(false),
  wishlistId: z.string().optional(),
});


// ============================================================================
// Hoofdschema voor een Evenement
// ============================================================================
export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  organizerId: z.string(),
  
  date: timestampSchema,
  registrationDeadline: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  lastReadTimestamps: z.record(z.string(), timestampSchema).optional(),

  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Ongeldig tijdformaat (HH:MM)").optional(),
  location: z.string().optional(),
  address: addressSchema.optional(),
  isPublic: z.boolean().default(false),
  budget: z.number().positive().optional(),
  maxParticipants: z.number().positive().int().optional(),
  
  participants: z.record(z.string(), eventParticipantSchema).default({}),
  
  isLootjesEvent: z.boolean().default(false),
  namesDrawn: z.boolean().default(false),
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

// ============================================================================
// CRUCIAAL: Schema voor Updates (gebruikt in Server Actions)
// ============================================================================
export const eventUpdateSchema = eventSchema.partial();


// ============================================================================
// Afgeleide TypeScript Types
// ============================================================================
export type Event = z.infer<typeof eventSchema>;
export type EventParticipant = z.infer<typeof eventParticipantSchema>;
export type Participant = EventParticipant;


// ============================================================================
// Schema en Type voor het aanmaken van een nieuw event
// ============================================================================
export const createEventSchema = eventSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    organizerId: true 
});
export type CreateEventData = z.infer<typeof createEventSchema>;