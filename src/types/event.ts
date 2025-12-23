// src/types/event.ts
import { z } from 'zod';

// ============================================================================
// 🎯 EVENT PROFILE OPTIONS (voor dropdowns, selects, etc.)
// ============================================================================

/**
 * ✅ Lightweight type voor event profile keuzes
 * 💡 Gebruikt in CreateEventForm, participant selection, etc.
 */
export type EventProfileOption = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string | null;
  isMainProfile: boolean;
};

// ============================================================================
// 📋 PARTICIPANT SCHEMA & TYPE
// ============================================================================

/**
 * ✅ Event Participant Schema
 * 💡 Gebruikt voor alle deelnemers aan een event (organizer + participants)
 */
export const eventParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal('')),
  
  // Status & Role
  role: z.enum(['organizer', 'participant']).default('participant'),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  confirmed: z.boolean().default(false),
  
  // Metadata
  addedAt: z.string().optional(), // ISO timestamp
  wishlistId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  profileId: z.string().optional().nullable(),
  
  // Legacy/backward compatibility
  name: z.string().optional(),
});

export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// ============================================================================
// 🎉 EVENT SCHEMA & TYPE
// ============================================================================

/**
 * ✅ Complete Event Schema
 * 💡 Main data structure voor alle events in de app
 * 🔥 Participants = Array (niet Record!) voor betere performance
 */
export const eventSchema = z.object({
  // ========== CORE IDENTITY ==========
  id: z.string(),
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  
  // ========== ORGANIZER (dual field voor backward compatibility) ==========
  organizer: z.string(), // Primary - Firebase userId
  organizerId: z.string().optional(), // Fallback
  organizerName: z.string().optional().nullable(),
  organizerEmail: z.string().email().optional().nullable(),
  organizerPhone: z.string().optional().nullable(),
  profileId: z.string().nullable().optional(), // Organizer's profile ID
  
  // ========== DATE & TIME (ISO STRINGS) ==========
  date: z.string(), // "2025-12-23"
  time: z.string().nullable().optional(), // "18:00"
  endTime: z.string().optional().nullable(), // "22:00"
  
  // ========== TIMESTAMPS (ISO STRINGS) ==========
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  registrationDeadline: z.string().nullable().optional(),
  
  // ========== PARTICIPANTS (ARRAY!) ==========
  participants: z.array(eventParticipantSchema).default([]),
  currentParticipantCount: z.number().int().default(0),
  participantCount: z.number().int().optional(), // Legacy
  
  // ========== BUDGET & LIMITS ==========
  budget: z.number().min(0).default(0),
  maxParticipants: z.number().positive().int().default(1000),
  
  // ========== LOOTJES/DRAWING ==========
  isLootjesEvent: z.boolean().default(false),
  drawnNames: z.record(z.string(), z.string()).default({}), // { userId: assignedUserId }
  namesDrawn: z.boolean().optional(), // Legacy
  allowDrawingNames: z.boolean().optional(), // Legacy
  exclusions: z.record(z.string(), z.array(z.string())).optional(), // { userId: [excludedUserId] }
  
  // ========== VISIBILITY & ACCESS ==========
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isInvited: z.boolean().default(false),
  
  // ========== CHAT & COLLABORATION ==========
  messages: z.array(z.any()).default([]),
  lastReadTimestamps: z.record(z.string(), z.number()).default({}), // { userId: timestamp }
  tasks: z.array(z.any()).default([]),
  
  // ========== APPEARANCE & METADATA ==========
  backgroundImage: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  
  // ========== STATUS ==========
  eventComplete: z.boolean().optional().default(false),
});

export type Event = z.infer<typeof eventSchema>;

// ============================================================================
// 🔄 CONVERSION UTILITIES (Record ↔ Array)
// ============================================================================

/**
 * ✅ Convert Firebase Record → App Array
 * 💡 Gebruikt bij het ophalen van events uit Firestore
 */
export function participantsToArray(
  participants: Record<string, EventParticipant> | EventParticipant[]
): EventParticipant[] {
  // Als het al een array is, return as-is
  if (Array.isArray(participants)) {
    return participants;
  }
  
  // Convert Record naar Array
  return Object.entries(participants).map(([id, participant]) => ({
    ...participant,
    id, // Zorg dat id altijd bestaat
  }));
}

/**
 * ✅ Convert App Array → Firebase Record
 * 💡 Gebruikt bij het opslaan van events naar Firestore
 */
export function participantsToRecord(
  participants: EventParticipant[]
): Record<string, EventParticipant> {
  return participants.reduce((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {} as Record<string, EventParticipant>);
}

// ============================================================================
// 🔍 HELPER FUNCTIONS
// ============================================================================

/**
 * ✅ Check of user organizer is van event
 */
export function isOrganizer(event: Event, userId: string): boolean {
  return event.organizer === userId || event.organizerId === userId;
}

/**
 * ✅ Check of user deelnemer is (inclusief organizer)
 */
export function isParticipant(event: Event, userId: string): boolean {
  return event.participants.some(p => p.id === userId);
}

/**
 * ✅ Get totaal aantal deelnemers
 */
export function getParticipantCount(event: Event): number {
  return event.participants.length;
}

/**
 * ✅ Get alle bevestigde deelnemers
 */
export function getConfirmedParticipants(event: Event): EventParticipant[] {
  return event.participants.filter(p => p.confirmed);
}

/**
 * ✅ Get alle onbevestigde deelnemers
 */
export function getUnconfirmedParticipants(event: Event): EventParticipant[] {
  return event.participants.filter(p => !p.confirmed);
}

/**
 * ✅ Get participant by userId
 */
export function getParticipantById(
  event: Event, 
  userId: string
): EventParticipant | undefined {
  return event.participants.find(p => p.id === userId);
}

/**
 * ✅ Check of user heeft bevestigd
 */
export function hasUserConfirmed(event: Event, userId: string): boolean {
  const participant = getParticipantById(event, userId);
  return participant?.confirmed ?? false;
}

// ============================================================================
// 📅 DATE & TIME HELPERS
// ============================================================================

/**
 * ✅ Get event status (upcoming/ongoing/past)
 */
export function getEventStatus(event: Event): 'upcoming' | 'ongoing' | 'past' {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Normaliseer naar start van dag voor vergelijking
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  
  if (eventDay.getTime() === today.getTime()) {
    return 'ongoing';
  }
  
  if (eventDay < today) {
    return 'past';
  }
  
  return 'upcoming';
}

/**
 * ✅ Get aantal dagen tot event
 */
export function getDaysUntilEvent(event: Event): number {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Normaliseer naar start van dag
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  
  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * ✅ Get geformatteerde datum (nl-BE)
 */
export function getFormattedEventDate(event: Event): string {
  const date = new Date(event.date);
  return date.toLocaleDateString('nl-BE', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * ✅ Get geformatteerde datum + tijd
 */
export function getFormattedEventDateTime(event: Event): string {
  const dateStr = getFormattedEventDate(event);
  
  if (!event.time) {
    return dateStr;
  }
  
  return `${dateStr} om ${event.time}`;
}

/**
 * ✅ Check of registratie deadline is verstreken
 */
export function isRegistrationClosed(event: Event): boolean {
  if (!event.registrationDeadline) {
    return false;
  }
  
  const now = new Date();
  const deadline = new Date(event.registrationDeadline);
  
  return now > deadline;
}

/**
 * ✅ Check of event vol is
 */
export function isEventFull(event: Event): boolean {
  return getParticipantCount(event) >= event.maxParticipants;
}

/**
 * ✅ Check of user kan registreren
 */
export function canUserRegister(event: Event, userId?: string): boolean {
  // Event moet toestaan self-registration
  if (!event.allowSelfRegistration) {
    return false;
  }
  
  // Event mag niet vol zijn
  if (isEventFull(event)) {
    return false;
  }
  
  // Registratie deadline mag niet verstreken zijn
  if (isRegistrationClosed(event)) {
    return false;
  }
  
  // User mag nog niet deelnemen
  if (userId && isParticipant(event, userId)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// 🎲 LOOTJES HELPERS
// ============================================================================

/**
 * ✅ Check of lootjes al getrokken zijn
 */
export function areNamesDrawn(event: Event): boolean {
  return Object.keys(event.drawnNames).length > 0;
}

/**
 * ✅ Get wie user moet trakteren (lootjes)
 */
export function getUsersAssignment(event: Event, userId: string): string | null {
  return event.drawnNames[userId] ?? null;
}

/**
 * ✅ Check of voldoende deelnemers voor lootjes (min 3)
 */
export function hasEnoughParticipantsForDraw(event: Event): boolean {
  return getConfirmedParticipants(event).length >= 3;
}

// ============================================================================
// 🛡️ TYPE GUARDS
// ============================================================================

/**
 * ✅ Type guard voor Event
 */
export function isEvent(obj: unknown): obj is Event {
  return eventSchema.safeParse(obj).success;
}

/**
 * ✅ Type guard voor EventParticipant
 */
export function isEventParticipant(obj: unknown): obj is EventParticipant {
  return eventParticipantSchema.safeParse(obj).success;
}

// ============================================================================
// 📊 CONSTANTS & ENUMS
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

export const PARTICIPANT_ROLE = {
  ORGANIZER: 'organizer',
  PARTICIPANT: 'participant',
} as const;

export const PARTICIPANT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;

export type EventVisibility = typeof EVENT_VISIBILITY[keyof typeof EVENT_VISIBILITY];
export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];
export type ParticipantRole = typeof PARTICIPANT_ROLE[keyof typeof PARTICIPANT_ROLE];
export type ParticipantStatus = typeof PARTICIPANT_STATUS[keyof typeof PARTICIPANT_STATUS];

// ============================================================================
// 📝 FORM SCHEMAS (voor React Hook Form + Zod validatie)
// ============================================================================

/**
 * ✅ Event Create/Edit Form Schema
 * 💡 Gebruikt in CreateEventForm component
 */
export const eventFormSchema = z.object({
  name: z.string().min(3, "Naam moet minstens 3 tekens bevatten"),
  // Maak datum velden expliciet verplicht als Date
  date: z.date({}).refine(val => val != null, { message: "Datum is verplicht" }),
  time: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  budget: z.number().min(0).optional().default(0),
  maxParticipants: z.number().positive().int().optional().default(1000),
  isLootjesEvent: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  backgroundImage: z.string().url().optional().nullable(),
  theme: z.string().optional().nullable(),
  // Deadline voor lootjes trekt - mag leeg, maar als ingevuld Date
  registrationDeadline: z.date().optional().nullable(),
  organizerProfileId: z.string().min(1, "Organisator is verplicht"),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * ✅ Event Creation Schema (voor Server Actions)
 * 💡 Omit fields die automatisch gegenereerd worden
 */
export const createEventSchema = eventSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  currentParticipantCount: true,
  participantCount: true,
});

export type CreateEventData = z.infer<typeof createEventSchema>;

/**
 * ✅ Event Update Schema (voor Server Actions)
 * 💡 Alle velden optioneel behalve id
 */
export const eventUpdateSchema = eventSchema.partial().omit({
  id: true,
});

export type UpdateEventData = z.infer<typeof eventUpdateSchema>;

/**
 * ✅ Participant Add Schema
 */
export const addParticipantSchema = eventParticipantSchema.omit({
  id: true,
  addedAt: true,
});

export type AddParticipantData = z.infer<typeof addParticipantSchema>;

// ============================================================================
// 🎨 DISPLAY HELPERS
// ============================================================================

/**
 * ✅ Get event visibility label
 */
export function getVisibilityLabel(event: Event): string {
  if (event.isPublic) return 'Publiek';
  if (event.isInvited) return 'Alleen genodigden';
  return 'Privé';
}

/**
 * ✅ Get event type label
 */
export function getEventTypeLabel(event: Event): string {
  if (event.isLootjesEvent) return 'Lootjes Event';
  return 'Gewoon Event';
}

/**
 * ✅ Get participant role label
 */
export function getParticipantRoleLabel(role: ParticipantRole): string {
  return role === 'organizer' ? 'Organisator' : 'Deelnemer';
}

/**
 * ✅ Get participant status label
 */
export function getParticipantStatusLabel(status: ParticipantStatus): string {
  switch (status) {
    case 'accepted': return 'Geaccepteerd';
    case 'declined': return 'Afgewezen';
    default: return 'In afwachting';
  }
}