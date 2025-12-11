// src/types/event.ts
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
// import { addressSchema } from './address';

// --- MENTOR'S NOTE (DE ECHTE DEFINITIEVE VERSIE) ---
// De fout zat in de z.date() constructor. Deze gebruikt 'message' en niet 'invalid_type_error'.
// Dit is de correcte, finale implementatie.
const timestampSchema = z.preprocess(
  // Argument 1: De transformatie functie
  (arg) => {
    if (arg instanceof Timestamp) return arg.toDate();
    if (arg && typeof arg === 'object' && 'toDate' in arg) return (arg as any).toDate();
    if (typeof arg === 'string' || typeof arg === 'number') {
        const date = new Date(arg);
        if (!isNaN(date.getTime())) return date;
    }
    return arg; 
  },
  // Argument 2: Het schema waartegen het resultaat gevalideerd wordt
  z.date({
    // DE FIX: Het moet 'message' zijn voor z.date()
    message: "Ongeldig datumformaat. Geef een geldige datum op."
  })
);


export const eventParticipantSchema = z.object({
  id: z.string(),
  email: z.string().email("Ongeldig e-mailadres").or(z.literal('')),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  confirmed: z.boolean().default(false),
  wishlistId: z.string().optional(),
  photoURL: z.string().url().optional().nullable(),
});

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  organizerId: z.string(),
  
  organizerName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Ongeldige URL").optional().nullable(),

  date: timestampSchema,
  time: z.string().optional(),
  endTime: z.string().optional(),
  theme: z.string().optional(),
  additionalInfo: z.string().optional(),
  organizerPhone: z.string().optional(),
  organizerEmail: z.string().email().optional(),

  registrationDeadline: timestampSchema.optional(),
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  
  location: z.string().optional(),
  // address: addressSchema.optional(),
  isPublic: z.boolean().default(false),
  budget: z.number().positive().optional(),
  maxParticipants: z.number().positive().int().optional(),
  
  participants: z.record(z.string(), eventParticipantSchema).default({}),
  participantCount: z.number().int().default(0),
  
  isLootjesEvent: z.boolean().default(false),
  namesDrawn: z.boolean().default(false),
  allowDrawingNames: z.boolean().optional().default(false),
  drawnNames: z.record(z.string(), z.string()).optional(),
  exclusions: z.record(z.string(), z.array(z.string())).optional(),

  allowSelfRegistration: z.boolean().default(false),
  eventComplete: z.boolean().default(false),
});

// --- Afgeleide Types ---
export type Event = z.infer<typeof eventSchema>;
export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// --- Create/Update Schema's ---
export const eventUpdateSchema = eventSchema.partial();
export const createEventSchema = eventSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    organizerId: true,
    organizerName: true,
});
export type CreateEventData = z.infer<typeof createEventSchema>;