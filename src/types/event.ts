import { z } from 'zod';
import { DateTime } from 'luxon';
import { Wishlist } from './wishlist';

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
  addedAt: z.string().nullable().default(() => DateTime.now().toISO()), // ✅ nullable + default
  wishlistId: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  profileId: z.string().optional().nullable(),
  name: z.string().optional(),
});

export type EventParticipant = z.infer<typeof eventParticipantSchema>;

// ==========================
// SESSION USER
// ==========================
export interface AuthenticatedSessionUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export const eventFormSchema = z.object({
  name: z.string().min(3),
  startDateTime: z.string(),
  endDateTime: z.string().optional(),
  location: z.string().optional(),
  theme: z.string().optional(),
  backgroundImage: z.string().optional(),
  additionalInfo: z.string().optional(),
  organizerPhone: z.string().optional(),
  organizerEmail: z.string().optional(),
  budget: z.number().min(0).default(0),
  maxParticipants: z.number().int().positive().default(1000),
  isLootjesEvent: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
export type CreateEventInput = EventFormData;

// ============================================================================
// CLIENT-SAFE HELPERS
// ============================================================================

export function getEventStatus(event: { startDateTime: string; endDateTime?: string | null }) {
  const now = DateTime.now();
  const start = DateTime.fromISO(event.startDateTime);
  const end = event.endDateTime ? DateTime.fromISO(event.endDateTime) : start;
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'past';
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface EventProfileOption {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string | null;
  isMainProfile?: boolean;
}

// ============================================================================
// EVENT / MESSAGE TYPES
// ============================================================================

export interface EventMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Event {
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
  messages: EventMessage[];
  tasks: unknown[];
  drawnNames: Record<string, string>;
  lastReadTimestamps: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  eventComplete: boolean;
  exclusions?: Record<string, string[]>;
  wishlists?: Record<string, Wishlist>;
  isInvited?: boolean;
  allowDrawingNames?: boolean;
  registrationDeadline?: string | null;
}

// ==========================
// EVENT MESSAGE
// ==========================
export interface EventMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}