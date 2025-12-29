import { Event, EventParticipant, EventMessage } from './event';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * 🔹 Converteer Firestore Timestamp of Date naar ISO string
 */
function toISO(value: any): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

/**
 * 🔹 Normaliseer een deelnemer object
 */
function normalizeParticipant(participant: any): EventParticipant {
  return {
    ...participant,
    addedAt: toISO(participant.addedAt) ?? undefined,
  };
}

/**
 * 🔹 Normaliseer een message object
 */
function normalizeMessage(message: any): EventMessage {
  return {
    ...message,
    timestamp: toISO(message.timestamp) ?? new Date().toISOString(),
  };
}

/**
 * 🔹 Normaliseer een Event object
 * Alle Firestore Timestamps of Dates worden ISO-strings
 * Optionele velden blijven optioneel, default arrays/objects worden gehandhaafd
 */
export function normalizeEvent(event: any): Event {
  return {
    ...event,
    date: toISO(event.date) ?? new Date().toISOString(),
    createdAt: toISO(event.createdAt) ?? new Date().toISOString(),
    updatedAt: toISO(event.updatedAt) ?? new Date().toISOString(),
    registrationDeadline: toISO(event.registrationDeadline),
    participants: (event.participants
      ? Object.values(event.participants).map(normalizeParticipant)
      : []) as EventParticipant[],
    messages: (event.messages ?? []).map(normalizeMessage),
    tasks: event.tasks ?? [],
    lastReadTimestamps: event.lastReadTimestamps ?? {},
    drawnNames: event.drawnNames ?? {},
  };
}