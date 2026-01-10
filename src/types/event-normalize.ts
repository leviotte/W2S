// src/lib/server/types/event-normalize.ts
'use server';
import { Event, EventParticipant, EventMessage } from '@/types/event';
import { Timestamp } from 'firebase-admin/firestore';
import { tsToIso } from '@/lib/server/firebase-timestamp';

/**
 * 🔹 Normaliseer een participant object
 */
function normalizeParticipant(participant: any): EventParticipant {
  return {
    ...participant,
    addedAt: participant.addedAt instanceof Timestamp
      ? participant.addedAt.toDate().toISOString()
      : participant.addedAt ?? new Date().toISOString(),
  };
}

/**
 * 🔹 Normaliseer een message object
 */
function normalizeMessage(message: any): EventMessage {
  return {
    ...message,
    timestamp: message.timestamp instanceof Timestamp
      ? message.timestamp.toDate().toISOString()
      : message.timestamp ?? new Date().toISOString(),
  };
}

/**
 * 🔹 Normaliseer een Event object
 * Timestamps (Firestore Timestamp | string) worden ISO-string
 * deelnemers blijven Record<string, EventParticipant>
 */
export async function normalizeEvent(event: any): Promise<Event> {
  const participants: Record<string, EventParticipant> = {};
  if (event.participants) {
    for (const [key, participant] of Object.entries(event.participants)) {
      participants[key] = normalizeParticipant(participant);
    }
  }

  const messages: EventMessage[] = (event.messages ?? []).map(normalizeMessage);

  return {
    ...event,
    startDateTime: (await tsToIso(event.startDateTime)) ?? new Date().toISOString(),
    endDateTime: (await tsToIso(event.endDateTime)) ?? null,
    createdAt: (await tsToIso(event.createdAt)) ?? new Date().toISOString(),
    updatedAt: (await tsToIso(event.updatedAt)) ?? new Date().toISOString(),
    participants,
    currentParticipantCount: Object.keys(participants).length,
    messages,
    tasks: event.tasks ?? [],
    drawnNames: event.drawnNames ?? {},
    lastReadTimestamps: event.lastReadTimestamps ?? {},
    eventComplete: !!event.eventComplete,
    
    // ✅ default voor optionele velden
    isLootjesEvent: event.isLootjesEvent ?? false,
    allowDrawingNames: event.allowDrawingNames ?? false,
    isInvited: event.isInvited ?? false,
  };
}
