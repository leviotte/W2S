// src/types/event.ts
import { z } from 'zod';

// ============================================================================
// PARTICIPANT SCHEMA (✅ AANGEPAST VOOR ARRAY GEBRUIK)
// ============================================================================

export const eventParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal('')),
  
  // ✅ TOEGEVOEGD: Fields voor conversie uit Firebase Record
  role: z.enum(['organizer', 'participant']).default('participant'),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  addedAt: z.string().optional(),
  
  // Bestaande velden
  confirmed: z.boolean().default(false),
  wishlistId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  
  // Backward compatibility
  name: z.string().optional(),
  profileId: z.string().optional().nullable(),
});

export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// ============================================================================
// EVENT SCHEMA - ✅ PARTICIPANTS NU ARRAY IN PLAATS VAN RECORD
// ============================================================================

export const eventSchema = z.object({
  // CORE FIELDS
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  
  // ✅ PRIMARY FIELD - matches Firebase
  organizer: z.string(),
  // ✅ FALLBACK for new data
  organizerId: z.string().optional(),
  
  // DATE & TIME - ISO STRINGS
  date: z.string(), // "2025-12-23"
  time: z.string().nullable().optional(),
  endTime: z.string().optional().nullable(),
  
  // TIMESTAMPS - ISO STRINGS
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  registrationDeadline: z.string().nullable().optional(),
  
  // BUDGET & PARTICIPANTS
  budget: z.number().min(0).default(0),
  maxParticipants: z.number().positive().int().default(1000),
  
  // ✅ CRITICAL FIX: PARTICIPANTS NU ARRAY (werd geconverteerd van Firebase Record)
  participants: z.array(eventParticipantSchema).default([]),
  currentParticipantCount: z.number().int().default(0),
  
  // LOOTJES/DRAWING
  isLootjesEvent: z.boolean().default(false),
  drawnNames: z.record(z.string(), z.string()).default({}),
  
  // VISIBILITY & REGISTRATION
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isInvited: z.boolean().default(false),
  
  // CHAT & TASKS
  messages: z.array(z.any()).default([]),
  lastReadTimestamps: z.record(z.string(), z.number()).default({}),
  tasks: z.array(z.any()).default([]),
  
  // OPTIONAL FIELDS
  profileId: z.string().nullable().optional(),
  backgroundImage: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  eventComplete: z.boolean().optional(),
  
  // LEGACY FIELDS
  organizerName: z.string().optional().nullable(),
  organizerPhone: z.string().optional().nullable(),
  organizerEmail: z.string().email().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  namesDrawn: z.boolean().optional(),
  allowDrawingNames: z.boolean().optional(),
  exclusions: z.record(z.string(), z.array(z.string())).optional(),
  participantCount: z.number().int().optional(),
});

export type Event = z.infer<typeof eventSchema>;

// ============================================================================
// UTILITY FUNCTIONS (✅ AANGEPAST VOOR ARRAY)
// ============================================================================

/**
 * Helper om participants van Record naar Array te converteren (voor Firebase → App)
 */
export function participantsToArray(participants: Record<string, EventParticipant>): EventParticipant[] {
  return Object.entries(participants).map(([id, participant]) => ({
    ...participant,
    id, // Zorg dat id altijd bestaat
  }));
}

/**
 * Helper om participants van Array naar Record te converteren (voor App → Firebase)
 */
export function participantsToRecord(participants: EventParticipant[]): Record<string, EventParticipant> {
  return participants.reduce((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {} as Record<string, EventParticipant>);
}

/**
 * Helper om te checken of een user organizer is
 */
export function isOrganizer(event: Event, userId: string): boolean {
  return event.organizer === userId || event.organizerId === userId;
}

/**
 * Helper om te checken of een user deelnemer is
 */
export function isParticipant(event: Event, userId: string): boolean {
  return event.participants.some(p => p.id === userId);
}

/**
 * Helper om participant count te berekenen
 */
export function getParticipantCount(event: Event): number {
  return event.participants.length;
}

/**
 * Helper om confirmed participants te krijgen
 */
export function getConfirmedParticipants(event: Event): EventParticipant[] {
  return event.participants.filter(p => p.confirmed);
}

/**
 * Helper om unconfirmed participants te krijgen
 */
export function getUnconfirmedParticipants(event: Event): EventParticipant[] {
  return event.participants.filter(p => !p.confirmed);
}

/**
 * Helper om event status te bepalen
 */
export function getEventStatus(event: Event): 'upcoming' | 'ongoing' | 'past' {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  if (eventDate.toDateString() === now.toDateString()) {
    return 'ongoing';
  }
  
  if (eventDate < now) {
    return 'past';
  }
  
  return 'upcoming';
}

/**
 * Helper om dagen tot event te berekenen
 */
export function getDaysUntilEvent(event: Event): number {
  const now = new Date();
  const eventDate = new Date(event.date);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Helper om formatted date string te krijgen
 */
export function getFormattedEventDate(event: Event): string {
  const date = new Date(event.date);
  return date.toLocaleDateString('nl-BE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard om te checken of een object een Event is
 */
export function isEvent(obj: any): obj is Event {
  return eventSchema.safeParse(obj).success;
}

/**
 * Type guard om te checken of een object een EventParticipant is
 */
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

// ============================================================================
// FORM SCHEMA (VOOR CLIENT-SIDE VALIDATIE)
// ============================================================================

export const eventFormSchema = z.object({
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  date: z.date({ message: "Datum is verplicht" }),
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
  registrationDeadline: z.date().optional().nullable(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// ============================================================================
// CREATE/UPDATE SCHEMAS
// ============================================================================

export const createEventSchema = eventSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  organizer: true,
  organizerId: true,
  currentParticipantCount: true,
  participantCount: true,
});

export type CreateEventData = z.infer<typeof createEventSchema>;

export const eventUpdateSchema = eventSchema.partial().omit({
  id: true,
});

export type UpdateEventData = z.infer<typeof eventUpdateSchema>;