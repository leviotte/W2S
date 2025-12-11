// src/types/event.ts
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { chatMessageSchema, type ChatMessage } from './chat';
import { taskSchema, type Task } from './task';

// ============================================================================
// TIMESTAMP SCHEMA
// ============================================================================

export const timestampSchema = z.preprocess(
  (arg) => {
    // Handle Firestore Timestamp
    if (arg instanceof Timestamp) return arg.toDate();
    
    // Handle Admin SDK Timestamp
    if (arg && typeof arg === 'object' && 'toDate' in arg) {
      return (arg as any).toDate();
    }
    
    // Handle ISO string or timestamp number
    if (typeof arg === 'string' || typeof arg === 'number') {
      const date = new Date(arg);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Handle Date objects
    if (arg instanceof Date) return arg;
    
    return arg;
  },
  z.date({
    message: "Ongeldig datumformaat. Geef een geldige datum op."
  })
);

// ============================================================================
// PARTICIPANT SCHEMA (GEFIXED VOOR NEXT.JS 16)
// ============================================================================

export const eventParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  
  // ✅ GEFIXED - email kan leeg zijn of optional
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal('')),
  
  confirmed: z.boolean().default(false),
  
  // ✅ GEFIXED - wishlistId kan null zijn
  wishlistId: z.string().optional().nullable(),
  
  // ✅ GEFIXED - photoURL kan null zijn
  photoURL: z.string().url().optional().nullable(),
  
  // Extra fields voor backward compatibility
  name: z.string().optional(), // Deprecated - use firstName + lastName
  profileId: z.string().optional().nullable(),
});

export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// ============================================================================
// EVENT SCHEMA (VOLLEDIG - NEXT.JS 16 COMPATIBLE)
// ============================================================================

export const eventSchema = z.object({
  // CORE FIELDS
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  organizerId: z.string(),
  
  // OPTIONAL INFO
  organizerName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Ongeldige URL").optional().nullable(),
  backgroundImage: z.string().url("Ongeldige URL").optional().nullable(),

  // DATE & TIME
  date: timestampSchema,
  time: z.string().optional().nullable(), // ✅ GEFIXED - kan null zijn
  endTime: z.string().optional().nullable(),
  
  // TIMESTAMPS
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  registrationDeadline: timestampSchema.optional().nullable(), // ✅ GEFIXED - kan null zijn
  
  // LOCATION & THEME
  location: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  
  // ORGANIZER CONTACT
  organizerPhone: z.string().optional().nullable(),
  organizerEmail: z.string().email().optional().nullable(),

  // VISIBILITY & REGISTRATION
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isInvited: z.boolean().optional().default(false),
  
  // BUDGET & PARTICIPANTS
  budget: z.number().min(0).optional().default(0),
  maxParticipants: z.number().positive().int().optional().default(1000),
  
  // ✅ PARTICIPANTS AS RECORD (Firestore structure)
  participants: z.record(z.string(), eventParticipantSchema).default({}),
  
  // ✅ PARTICIPANT COUNT
  currentParticipantCount: z.number().int().default(0),
  participantCount: z.number().int().optional(), // Deprecated - use currentParticipantCount
  
  // CHAT & TASKS (IMPORTED SCHEMAS)
  messages: z.array(chatMessageSchema).default([]),
  lastReadTimestamps: z.record(z.string(), z.number()).default({}),
  tasks: z.array(taskSchema).default([]),
  
  // LOOTJES/DRAWING FEATURES
  isLootjesEvent: z.boolean().default(false),
  namesDrawn: z.boolean().default(false),
  allowDrawingNames: z.boolean().optional().default(false),
  drawnNames: z.record(z.string(), z.string()).default({}),
  exclusions: z.record(z.string(), z.array(z.string())).optional().default({}),

  // STATUS
  eventComplete: z.boolean().default(false),
  
  // ✅ BACKWARD COMPATIBILITY FIELDS
  organizer: z.string().optional(), // Deprecated - use organizerId
  profileId: z.string().optional().nullable(),
});

export type Event = z.infer<typeof eventSchema>;

// ============================================================================
// RE-EXPORT IMPORTED TYPES
// ============================================================================

export type { ChatMessage, Task };

// ============================================================================
// CREATE/UPDATE SCHEMAS
// ============================================================================

/**
 * Schema voor het aanmaken van een nieuw evenement
 * Verwijdert auto-generated fields (id, timestamps, organizerId)
 */
export const createEventSchema = eventSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  organizerId: true,
  organizerName: true,
  currentParticipantCount: true,
  participantCount: true,
});

export type CreateEventData = z.infer<typeof createEventSchema>;

/**
 * Schema voor het updaten van een evenement
 * Alle velden zijn optioneel
 */
export const eventUpdateSchema = eventSchema.partial().omit({
  id: true,
});

export type UpdateEventData = z.infer<typeof eventUpdateSchema>;

/**
 * Schema voor evenement formulier validatie
 * ✅ GEFIXED - Zod v4+ syntax
 */
export const eventFormSchema = z.object({
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  
  // ✅ GEFIXED - gebruik .refine() in plaats van required_error
  date: z.date({
    message: "Datum is verplicht"
  }).refine((date) => date !== null && date !== undefined, {
    message: "Datum is verplicht"
  }),
  
  time: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  budget: z.number().min(0).optional(),
  maxParticipants: z.number().positive().int().optional(),
  isLootjesEvent: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  backgroundImage: z.string().url().optional().nullable(),
  theme: z.string().optional().nullable(),
  
  registrationDeadline: z.date({
    message: "Ongeldige registratiedeadline"
  }).optional().nullable(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type voor evenement met participant array (voor UI)
 */
export type EventWithParticipantArray = Omit<Event, 'participants'> & {
  participants: EventParticipant[];
};

/**
 * Helper om participants van Record naar Array te converteren
 */
export function participantsToArray(participants: Record<string, EventParticipant>): EventParticipant[] {
  return Object.values(participants);
}

/**
 * Helper om participants van Array naar Record te converteren
 */
export function participantsToRecord(participants: EventParticipant[]): Record<string, EventParticipant> {
  return participants.reduce((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {} as Record<string, EventParticipant>);
}

/**
 * Type guards
 */
export function isEvent(obj: any): obj is Event {
  return eventSchema.safeParse(obj).success;
}

export function isEventParticipant(obj: any): obj is EventParticipant {
  return eventParticipantSchema.safeParse(obj).success;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EVENT_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INVITED: 'invited',
} as const;

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  PAST: 'past',
} as const;

export type EventVisibility = typeof EVENT_VISIBILITY[keyof typeof EVENT_VISIBILITY];
export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

/**
 * Helper om event status te bepalen
 */
export function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Als het evenement vandaag is
  if (eventDate.toDateString() === now.toDateString()) {
    return EVENT_STATUS.ONGOING;
  }
  
  // Als het evenement in het verleden is
  if (eventDate < now) {
    return EVENT_STATUS.PAST;
  }
  
  // Anders is het in de toekomst
  return EVENT_STATUS.UPCOMING;
}

/**
 * Helper om te checken of een user deelnemer is
 */
export function isParticipant(event: Event, userId: string): boolean {
  return !!event.participants[userId];
}

/**
 * Helper om te checken of een user de organizer is
 */
export function isOrganizer(event: Event, userId: string): boolean {
  return event.organizerId === userId || event.organizer === userId;
}

/**
 * Helper om participant count te berekenen
 */
export function getParticipantCount(event: Event): number {
  return Object.keys(event.participants).length;
}

/**
 * Helper om confirmed participants te krijgen
 */
export function getConfirmedParticipants(event: Event): EventParticipant[] {
  return participantsToArray(event.participants).filter(p => p.confirmed);
}

/**
 * Helper om unconfirmed participants te krijgen
 */
export function getUnconfirmedParticipants(event: Event): EventParticipant[] {
  return participantsToArray(event.participants).filter(p => !p.confirmed);
}