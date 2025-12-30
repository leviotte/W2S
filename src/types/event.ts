// src/types/event.ts
import { z } from 'zod';
import { DateTime } from 'luxon';

// ============================================================================
// EVENT PROFILE
// ============================================================================

export type EventProfileOption = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string | null;
  isMainProfile: boolean;
};

// ============================================================================
// PARTICIPANT
// ============================================================================

export const eventParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  role: z.enum(['organizer', 'participant']).default('participant'),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  confirmed: z.boolean().default(false),
  addedAt: z.string().optional(), // altijd ISO string
  wishlistId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  profileId: z.string().optional().nullable(),
  name: z.string().optional(),
});

export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// ============================================================================
// MESSAGE & TASK
// ============================================================================

export const eventMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

export const eventTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean().default(false),
  assignedTo: z.array(z.string()).default([]),
});

export type EventMessage = z.infer<typeof eventMessageSchema>;
export type EventTask = z.infer<typeof eventTaskSchema>;

// ============================================================================
// EVENT
// ============================================================================

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(3),

  organizer: z.string(),
  organizerId: z.string().optional(),
  organizerName: z.string().optional().nullable(),
  organizerEmail: z.string().email().optional().nullable(),
  organizerPhone: z.string().optional().nullable(),
  profileId: z.string().nullable().optional(),

  startDateTime: z.string(), // ISO string
  endDateTime: z.string().nullable().optional(),
  registrationDeadline: z.string().nullable().optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  participants: z.array(eventParticipantSchema).default([]),
  currentParticipantCount: z.number().int().default(0),
  participantCount: z.number().int().optional(),

  budget: z.number().min(0).default(0),
  maxParticipants: z.number().positive().int().default(1000),

  isLootjesEvent: z.boolean().default(false),
  drawnNames: z.record(z.string(), z.string()).default({}),
  namesDrawn: z.boolean().optional(),
  allowDrawingNames: z.boolean().optional(),
  exclusions: z.record(z.string(), z.array(z.string())).optional(),

  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  isInvited: z.boolean().default(false),

  messages: z.array(eventMessageSchema).default([]),
  lastReadTimestamps: z.record(z.string(), z.number()).default({}),
  tasks: z.array(eventTaskSchema).default([]),

  backgroundImage: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),

  eventComplete: z.boolean().default(false),
});

export type Event = z.infer<typeof eventSchema>;
export type EventFormData = z.infer<typeof eventSchema>;

// ============================================================================
// UTILITIES
// ============================================================================

export function normalizeEvent(event: any): Event {
  return eventSchema.parse({
    ...event,
    startDateTime: event.startDateTime instanceof Date ? event.startDateTime.toISOString() : event.startDateTime,
    endDateTime: event.endDateTime instanceof Date ? event.endDateTime.toISOString() : event.endDateTime,
    registrationDeadline:
      event.registrationDeadline instanceof Date ? event.registrationDeadline.toISOString() : event.registrationDeadline,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
    participants:
      event.participants?.map((p: any) => ({
        ...p,
        addedAt: p.addedAt instanceof Date ? p.addedAt.toISOString() : p.addedAt,
      })) || [],
    messages:
      event.messages?.map((m: any) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      })) || [],
  });
}

export function participantsToArray(
  participants: Record<string, EventParticipant> | EventParticipant[] | undefined,
) {
  if (!participants) return [];
  return Array.isArray(participants) ? participants : Object.entries(participants).map(([id, p]) => ({ ...p, id }));
}

export function participantsToRecord(participants: EventParticipant[]) {
  return participants.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {} as Record<string, EventParticipant>);
}

export function getEventStatus(event: Event): 'upcoming' | 'ongoing' | 'past' {
  const now = DateTime.now();
  const start = DateTime.fromISO(event.startDateTime);
  const end = event.endDateTime ? DateTime.fromISO(event.endDateTime) : start;
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'past';
}

export function getDaysUntilEvent(event: Event) {
  const now = DateTime.now().startOf('day');
  const start = DateTime.fromISO(event.startDateTime).startOf('day');
  return Math.ceil(start.diff(now, 'days').days);
}

export function isEvent(obj: unknown): obj is Event {
  return eventSchema.safeParse(obj).success;
}

export function isEventParticipant(obj: unknown): obj is EventParticipant {
  return eventParticipantSchema.safeParse(obj).success;
}

// ============================================================================
// FIRESTORE <-> ISO HELPERS
// ============================================================================

import { Timestamp } from 'firebase-admin/firestore';

export const tsToIso = (val: Timestamp | string | null | undefined): string | null =>
  val instanceof Timestamp ? val.toDate().toISOString() : val ?? null;

export const isoToTs = (val: string | null | undefined): Timestamp | null =>
  val ? Timestamp.fromDate(new Date(val)) : null;
