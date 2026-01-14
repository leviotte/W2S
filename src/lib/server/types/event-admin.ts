// src/lib/server/types/event-admin.ts
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { eventParticipantSchema, type EventParticipant } from '@/types/event';

// =======================
// BACKGROUNDS / CATEGORIES
// =======================

export interface BackImages {
  id: string;
  name?: string;
  url: string;
  title: string;
  imageLink: string;
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

// =======================
// EVENT INTERFACE
// =======================

export interface ServerEvent {
  id: string;
  name: string;
  organizer: string;
  organizerId: string;
  startDateTime: string;
  endDateTime?: string | null;
  location?: string | null;
  theme?: string | null;
  backgroundImage?: string | null;
  additionalInfo?: string | null;
  organizerPhone?: string | null;
  organizerEmail?: string | null;
  budget: number;
  maxParticipants: number;
  isLootjesEvent: boolean;
  isPublic: boolean;
  allowSelfRegistration: boolean;
  participants: Record<string, EventParticipant>;
  currentParticipantCount: number;
  messages: unknown[];
  tasks: unknown[];
  drawnNames: Record<string, string>;
  lastReadTimestamps: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  eventComplete: boolean;
  registrationDeadline?: string | null;
  allowDrawingNames?: boolean;
}

// =======================
// ZOD SCHEMA (SERVER-SIDE VALIDATION)
// =======================

export const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  organizer: z.string(),
  organizerId: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
  backgroundImage: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
  organizerPhone: z.string().nullable().optional(),
  organizerEmail: z.string().nullable().optional(),
  budget: z.number().default(0),
  maxParticipants: z.number().default(1000),
  isLootjesEvent: z.boolean(),
  isPublic: z.boolean(),
  allowSelfRegistration: z.boolean(),
  participants: z.record(z.string(), eventParticipantSchema),
  currentParticipantCount: z.number(),
  messages: z.array(z.any()),
  tasks: z.array(z.any()),
  drawnNames: z.record(z.string(), z.string()),
  lastReadTimestamps: z.record(z.string(), z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  eventComplete: z.boolean(),
  registrationDeadline: z.string().nullable().optional(),
  allowDrawingNames: z.boolean().optional(),
});

// =======================
// NORMALIZE EVENT
// =======================

export function normalizeEvent(data: any): ServerEvent {
  const participants = data.participants ?? {};

  return {
    id: data.id,
    name: data.name,
    organizer: data.organizer,
    organizerId: data.organizerId ?? data.organizer,

    // 🔴 VERPLICHT – ONTBRAK
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime ?? null,

    location: data.location ?? null,
    theme: data.theme ?? null,
    backgroundImage: data.backgroundImage ?? null,
    additionalInfo: data.additionalInfo ?? null,
    organizerPhone: data.organizerPhone ?? null,
    organizerEmail: data.organizerEmail ?? null,

    budget: data.budget ?? 0,
    maxParticipants: data.maxParticipants ?? 1000,

    isLootjesEvent: !!data.isLootjesEvent,
    isPublic: !!data.isPublic,
    allowSelfRegistration: !!data.allowSelfRegistration,

    participants,
    currentParticipantCount:
      typeof data.currentParticipantCount === 'number'
        ? data.currentParticipantCount
        : Object.keys(participants).length,

    messages: data.messages ?? [],
    tasks: data.tasks ?? [],
    drawnNames: data.drawnNames ?? {},
    lastReadTimestamps: data.lastReadTimestamps ?? {},

    // 🔴 VERPLICHT – ONTBRAK
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,

    eventComplete: !!data.eventComplete,
    registrationDeadline: data.registrationDeadline ?? null,
    allowDrawingNames: data.allowDrawingNames ?? false,
  };
}

export type UpdateEventData = Partial<ServerEvent> & {
  allowDrawingNames?: boolean;
  isInvited?: boolean;
};