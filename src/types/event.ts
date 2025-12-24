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
  step: z.number().min(1).max(2),

  name: z.string().min(3, { message: 'Naam moet minimaal 3 karakters zijn.' }),

  date: z.preprocess(
    val => {
      if (val instanceof Date) return val;
      if (typeof val === 'string' && val) {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    },
    z.date().nullable()
  ),

  time: z.string().optional(),
  description: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),

  organizerProfileId: z.string().min(1, { message: 'Kies een organisator.' }),

  drawNames: z.boolean().default(false),
  registrationDeadline: z.date().nullable().optional(),

  participantType: z.enum(['manual', 'self-register']),
  maxParticipants: z.coerce.number().positive().optional(),

  participants: z.array(eventParticipantSchema).default([]),
})
.superRefine((data, ctx) => {
  const { step, drawNames, participantType, participants, name, date, registrationDeadline } = data;

  if (step === 1) {
    if (!name) {
      ctx.addIssue({ path: ['name'], code: 'custom', message: 'Naam is verplicht' });
    }

    if (!date) {
      ctx.addIssue({ path: ['date'], code: 'custom', message: 'Datum is verplicht' });
    }

    if (date && date < todayISO()) {
      ctx.addIssue({
        path: ['date'],
        code: 'custom',
        message: 'Datum mag niet in het verleden liggen.',
      });
    }

    if (drawNames && registrationDeadline && date && registrationDeadline > date) {
      ctx.addIssue({
        path: ['registrationDeadline'],
        code: 'custom',
        message: 'Deadline moet vóór de eventdatum liggen.',
      });
    }
  }

  if (step === 2 && participantType === 'manual') {
    const extraParticipants = participants.slice(1);

    if (drawNames && participants.length < 3) {
      ctx.addIssue({
        path: ['participants'],
        code: 'custom',
        message: 'Minimaal 3 deelnemers vereist voor lootjesevents.',
      });
    }

    const lowerNames = participants.map(p =>
      `${p.firstName?.trim().toLowerCase() || ''} ${p.lastName?.trim().toLowerCase() || ''}`
    );

    if (lowerNames.length !== new Set(lowerNames).size) {
      ctx.addIssue({
        path: ['participants'],
        code: 'custom',
        message: 'Dubbele deelnamenamen niet toegestaan.',
      });
    }

    extraParticipants.forEach((p, i) => {
      const idx = i + 1;
      if (!p.firstName?.trim()) {
        ctx.addIssue({
          path: ['participants', idx, 'firstName'],
          code: 'custom',
          message: 'Voornaam is verplicht',
        });
      }
      if (!p.lastName?.trim()) {
        ctx.addIssue({
          path: ['participants', idx, 'lastName'],
          code: 'custom',
          message: 'Achternaam is verplicht',
        });
      }
    });
  }
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// Utility mag hier ook staan:
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
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
