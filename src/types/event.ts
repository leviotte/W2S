// src/types/event.ts
import { z } from 'zod';
import { DateTime } from 'luxon';

// Event Profile
export type EventProfileOption = { id: string; firstName: string; lastName: string; displayName: string; photoURL: string | null; isMainProfile: boolean; };

// Participant
export const eventParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  role: z.enum(['organizer','participant']).default('participant'),
  status: z.enum(['pending','accepted','declined']).default('pending'),
  confirmed: z.boolean().default(false),
  addedAt: z.preprocess(val => val instanceof Date ? val.toISOString() : val, z.string().optional()),
  wishlistId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  profileId: z.string().optional().nullable(),
  name: z.string().optional(),
});
export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// Message & Task
export const eventMessageSchema = z.object({ id: z.string(), senderId: z.string(), content: z.string(), timestamp: z.preprocess(val => val instanceof Date ? val.toISOString() : val, z.string()) });
export const eventTaskSchema = z.object({ id: z.string(), title: z.string(), completed: z.boolean().default(false), assignedTo: z.array(z.string()).default([]) });
export type EventMessage = z.infer<typeof eventMessageSchema>;
export type EventTask = z.infer<typeof eventTaskSchema>;

// Event
export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  organizer: z.string(),
  organizerId: z.string().optional(),
  organizerName: z.string().optional().nullable(),
  organizerEmail: z.string().email().optional().nullable(),
  organizerPhone: z.string().optional().nullable(),
  profileId: z.string().nullable().optional(),
  date: z.preprocess(val => val instanceof Date ? val.toISOString() : val, z.string()),
  time: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  createdAt: z.preprocess(val => val instanceof Date ? val.toISOString() : val, z.string().optional()),
  updatedAt: z.preprocess(val => val instanceof Date ? val.toISOString() : val, z.string().optional()),
  registrationDeadline: z.preprocess(val => val ? (val instanceof Date ? val.toISOString() : val) : null, z.string().nullable().optional()),
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
  eventComplete: z.boolean().optional().default(false),
});
export type Event = z.infer<typeof eventSchema>;
export type EventFormData = z.infer<typeof eventSchema>;

// Utilities
export function normalizeEvent(event: any): Event {
  return eventSchema.parse({
    ...event,
    date: event.date instanceof Date ? event.date.toISOString() : event.date,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
    registrationDeadline: event.registrationDeadline instanceof Date ? event.registrationDeadline.toISOString() : event.registrationDeadline,
    participants: event.participants?.map((p:any)=>({ ...p, addedAt: p.addedAt instanceof Date ? p.addedAt.toISOString() : p.addedAt })) || [],
    messages: event.messages?.map((m:any)=>({...m,timestamp:m.timestamp instanceof Date?m.timestamp.toISOString():m.timestamp})) || [],
  });
}

export function participantsToArray(participants: Record<string, EventParticipant> | EventParticipant[] | undefined) {
  if (!participants) return [];
  return Array.isArray(participants) ? participants : Object.entries(participants).map(([id,p])=>({ ...p, id }));
}

export function participantsToRecord(participants: EventParticipant[]) {
  return participants.reduce((acc,p)=>{ acc[p.id]=p; return acc; }, {} as Record<string, EventParticipant>);
}

export function isOrganizer(event: Event, userId: string) { return event.organizer === userId || event.organizerId === userId; }
export function isParticipant(event: Event, userId: string) { return event.participants.some(p => p.id === userId); }
export function getParticipantById(event: Event, userId: string) { return event.participants.find(p => p.id === userId); }
export function hasUserConfirmed(event: Event, userId: string) { return getParticipantById(event,userId)?.confirmed ?? false; }
export function getConfirmedParticipants(event: Event) { return event.participants.filter(p=>p.confirmed); }
export function getUnconfirmedParticipants(event: Event) { return event.participants.filter(p=>!p.confirmed); }
export function getParticipantCount(event: Event) { return event.participants.length; }

// Date helpers (Luxon)
export function getEventStatus(event: Event): 'upcoming'|'ongoing'|'past' {
  const now = DateTime.now().startOf('day');
  const eventDay = DateTime.fromISO(event.date).startOf('day');
  if (eventDay.equals(now)) return 'ongoing';
  if (eventDay < now) return 'past';
  return 'upcoming';
}
export function getDaysUntilEvent(event: Event) {
  const now = DateTime.now().startOf('day');
  const eventDay = DateTime.fromISO(event.date).startOf('day');
  return Math.ceil(eventDay.diff(now,'days').days);
}

// Type guards
export function isEvent(obj: unknown): obj is Event { return eventSchema.safeParse(obj).success; }
export function isEventParticipant(obj: unknown): obj is EventParticipant { return eventParticipantSchema.safeParse(obj).success; }
