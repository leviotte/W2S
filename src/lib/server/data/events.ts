// src/lib/server/data/events.ts
import 'server-only';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/server/firebase-admin';
import { eventSchema } from '@/lib/server/types/event-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Event } from '@/types/event';

// ============================================================================
// FIRESTORE TIMESTAMP CONVERTER
// ============================================================================

function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Firestore Timestamp object
  if (obj instanceof Timestamp) return obj.toDate().toISOString();

  // Nested arrays
  if (Array.isArray(obj)) return obj.map(item => convertTimestamps(item));

  // Nested objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertTimestamps(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

// ============================================================================
// SERIALIZE DOCUMENT
// ============================================================================

function serializeDoc(doc: admin.firestore.DocumentSnapshot): Record<string, any> | null {
  const data = doc.data();
  if (!data) return null;

  const serialized = convertTimestamps(data);
  return { id: doc.id, ...serialized };
}

// ============================================================================
// GET SINGLE EVENT
// ============================================================================

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const doc = await adminDb.collection('events').doc(eventId).get();
    if (!doc.exists) return null;

    const serialized = serializeDoc(doc);
    if (!serialized) return null;

    const participants = serialized.participants
      ? Object.entries(serialized.participants).map(([pid, p]: [string, any]) => ({
          id: pid,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || null,
          role: p.role || 'participant',
          status: p.status || 'pending',
          confirmed: p.confirmed || false,
          addedAt: p.addedAt || new Date().toISOString(),
          wishlistId: p.wishlistId || null,
          photoURL: p.photoURL || null,
          profileId: p.profileId || null,
          name: p.name || null,
        }))
      : [];

    const convertedEvent = {
      ...serialized,
      participants,
      startDateTime: serialized.startDateTime,
      endDateTime: serialized.endDateTime,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      registrationDeadline: serialized.registrationDeadline,
    };

    const parsed = eventSchema.safeParse(convertedEvent);
    if (!parsed.success) {
      console.error('Event validation failed:', eventId, parsed.error.flatten());
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error('Error fetching event:', eventId, error);
    return null;
  }
}

// ============================================================================
// GET EVENTS FOR USER
// ============================================================================

export async function getEventsForUser(userId: string, profileId?: string): Promise<Event[]> {
  if (!userId) return [];

  try {
    const eventsRef = adminDb.collection('events');

    const effectiveId = profileId || userId;

    const organizerSnap = await eventsRef.where('organizer', '==', effectiveId).get();
    const allEventsSnap = await eventsRef.get();

    const eventsMap = new Map<string, any>();

    organizerSnap.forEach(doc => eventsMap.set(doc.id, serializeDoc(doc)));

    allEventsSnap.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || {};
      if (Object.values(participants).some((p: any) => p?.id === userId || p?.id === profileId)) {
        if (!eventsMap.has(doc.id)) eventsMap.set(doc.id, serializeDoc(doc));
      }
    });

    const events: Event[] = [];
    for (const eventData of eventsMap.values()) {
      if (!eventData) continue;

      const participants = eventData.participants
        ? Object.entries(eventData.participants).map(([pid, p]: [string, any]) => ({
            id: pid,
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            email: p.email || null,
            role: p.role || 'participant',
            status: p.status || 'pending',
            confirmed: p.confirmed || false,
            addedAt: p.addedAt || new Date().toISOString(),
            wishlistId: p.wishlistId || null,
            photoURL: p.photoURL || null,
            profileId: p.profileId || null,
            name: p.name || null,
          }))
        : [];

      const parsed = eventSchema.safeParse({
        ...eventData,
        participants,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        createdAt: eventData.createdAt,
        updatedAt: eventData.updatedAt,
        registrationDeadline: eventData.registrationDeadline,
      });

      if (parsed.success) events.push(parsed.data);
      else console.warn('Event validation failed:', eventData.id, parsed.error.flatten());
    }

    return events.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  } catch (error) {
    console.error('Error fetching events for user:', userId, error);
    return [];
  }
}

// ============================================================================
// GET EVENT COUNTS
// ============================================================================

export async function getEventCountsForUser(userId: string): Promise<{ upcoming: number; past: number }> {
  const events = await getEventsForUser(userId);
  const now = new Date();

  const upcoming = events.filter(e => new Date(e.startDateTime) >= now).length;
  const past = events.filter(e => new Date(e.startDateTime) < now).length;

  return { upcoming, past };
}

// ============================================================================
// CACHE TAG HELPERS
// ============================================================================

export function getEventCacheTags(userId: string): string[] {
  return [`user-events:${userId}`, `event-counts:${userId}`];
}
