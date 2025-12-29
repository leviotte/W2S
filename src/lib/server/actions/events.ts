// src/lib/server/actions/events.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { Timestamp } from 'firebase-admin/firestore';
import { Event, EventParticipant, normalizeEvent, participantsToRecord, participantsToArray } from '@/types/event';

// ============================================================================
// HELPERS
// ============================================================================

function participantsArrayToMap(participants: EventParticipant[]): Record<string, EventParticipant> {
  return participantsToRecord(participants);
}

function isLoggedInUser(user: any): user is { id: string } {
  return user && typeof user.id === 'string';
}

// ============================================================================
// READ ACTIONS - STRICT TYPED & TIMESTAMP-SAFE
// ============================================================================

export interface GetUserEventsParams {
  userId: string;
  filter?: 'upcoming' | 'past' | 'all';
}

export async function getUserEventsAction(params: GetUserEventsParams): Promise<{ success: boolean; data?: Event[] }> {
  const { userId, filter = 'all' } = params;
  const eventsRef = adminDb.collection('events');

  // Haal events op waar de user organizer is of participant
  const [organizerSnap, participantSnap] = await Promise.all([
    eventsRef.where('organizer', '==', userId).get(),
    eventsRef.where(`participants.${userId}.id`, '==', userId).get(),
  ]);

  // Unieke events samenvoegen
  const eventsMap = new Map<string, any>();
  organizerSnap.forEach(doc => eventsMap.set(doc.id, { id: doc.id, ...doc.data() }));
  participantSnap.forEach(doc => eventsMap.set(doc.id, { id: doc.id, ...doc.data() }));

  // Normalize & sort
  let events: Event[] = Array.from(eventsMap.values()).map(e => normalizeEvent(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter
  const now = new Date().toISOString();
  if (filter === 'upcoming') events = events.filter(e => e.date >= now);
  if (filter === 'past') events = events.filter(e => e.date < now);

  return { success: true, data: events };
}

export async function getEventByIdAction(eventId: string): Promise<{ success: boolean; data?: Event }> {
  const doc = await adminDb.collection('events').doc(eventId).get();
  if (!doc.exists) return { success: false };

  const data = doc.data();
  if (!data) return { success: false };

  // normalizeEvent zorgt dat timestamps als ISO string terugkomen
  return { success: true, data: normalizeEvent({ id: doc.id, ...data }) };
}

// ============================================================================
// CREATE ACTION
// ============================================================================

export async function createEventAction(eventData: Partial<Event>) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const userId = session.user.id;
  const eventId = crypto.randomUUID();

  const participantsMap = Array.isArray(eventData.participants)
    ? participantsArrayToMap(eventData.participants)
    : eventData.participants ?? {};

  const eventDate = eventData.date ? new Date(eventData.date) : new Date();
  const registrationDeadline = eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null;

  const eventDoc: Omit<Event, 'id'> & { id: string } = {
    id: eventId,
    name: eventData.name?.trim() || 'Nieuw Evenement',
    date: Timestamp.fromDate(eventDate),
    time: eventData.time ?? null,
    budget: eventData.budget ?? 0,
    organizer: userId,
    organizerId: userId,
    profileId: eventData.profileId ?? null,
    isLootjesEvent: eventData.isLootjesEvent ?? false,
    registrationDeadline: registrationDeadline ? Timestamp.fromDate(registrationDeadline) : null,
    maxParticipants: eventData.maxParticipants ?? 1000,
    participants: participantsMap,
    currentParticipantCount: Object.keys(participantsMap).length,
    backgroundImage: eventData.backgroundImage ?? 'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media',
    messages: [],
    lastReadTimestamps: {},
    drawnNames: {},
    tasks: [],
    allowSelfRegistration: eventData.allowSelfRegistration ?? false,
    isInvited: eventData.isInvited ?? false,
    isPublic: eventData.isPublic ?? false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    eventComplete: eventData.eventComplete ?? false,
    theme: eventData.theme ?? null,
    location: eventData.location ?? null,
    description: eventData.description ?? null,
    additionalInfo: eventData.additionalInfo ?? null,
    imageUrl: eventData.imageUrl ?? null,
  };

  await adminDb.collection('events').doc(eventId).set(eventDoc);

  return { success: true, message: 'Evenement aangemaakt!', eventId };
}

// ============================================================================
// UPDATE ACTION
// ============================================================================

export async function updateEventAction(eventId: string, updateData: Partial<Event>) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });

  if (existingEvent.organizer !== session.user.id) {
    return { success: false, message: 'Alleen de organizer kan updaten' };
  }

  const dataToUpdate: Partial<Event> = { ...updateData, updatedAt: Timestamp.now() } as any;

  if (updateData.date) dataToUpdate.date = Timestamp.fromDate(new Date(updateData.date));
  if (updateData.registrationDeadline) dataToUpdate.registrationDeadline = Timestamp.fromDate(new Date(updateData.registrationDeadline));

  await eventRef.update(dataToUpdate);

  return { success: true, message: 'Evenement bijgewerkt!' };
}

// ============================================================================
// DELETE ACTION
// ============================================================================

export async function deleteEventAction(eventId: string) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) {
    return { success: false, message: 'Alleen de organizer kan verwijderen' };
  }

  await eventRef.delete();
  return { success: true, message: 'Evenement verwijderd!' };
}

// ============================================================================
// PARTICIPANT ACTIONS
// ============================================================================

export async function registerParticipantAction(eventId: string, participant: EventParticipant) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const currentParticipants = doc.data()?.participants ?? {};
  const updatedParticipants = { ...currentParticipants, [participant.id]: participant };

  await eventRef.update({
    participants: updatedParticipants,
    currentParticipantCount: Object.keys(updatedParticipants).length,
    updatedAt: Timestamp.now(),
  });

  return { success: true, message: 'Deelnemer geregistreerd!' };
}

export async function confirmParticipantAction(eventId: string, participantId: string, confirmed = true) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const participants = doc.data()?.participants ?? {};
  if (!participants[participantId]) return { success: false, message: 'Deelnemer niet gevonden' };

  participants[participantId] = { ...participants[participantId], confirmed };

  await eventRef.update({
    participants,
    updatedAt: Timestamp.now(),
  });

  return { success: true, message: 'Deelnemer status bijgewerkt!' };
}

// ============================================================================
// TASK ACTIONS
// ============================================================================

export async function updateEventTasksAction(eventId: string, tasks: any[]) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan taken updaten' };

  await eventRef.update({ tasks, updatedAt: Timestamp.now() });

  return { success: true, message: 'Taken bijgewerkt!' };
}

export async function assignParticipantToTaskAction(eventId: string, taskId: string, participantId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = event.tasks || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].assignedTo = [...new Set([...(tasks[taskIndex].assignedTo || []), participantId])];

  await eventRef.update({ tasks, updatedAt: Timestamp.now() });
  return { success: true, message: 'Deelnemer toegewezen!' };
}

export async function removeParticipantFromTaskAction(eventId: string, taskId: string, participantId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = event.tasks || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].assignedTo = (tasks[taskIndex].assignedTo || []).filter(id => id !== participantId);

  await eventRef.update({ tasks, updatedAt: Timestamp.now() });
  return { success: true, message: 'Deelnemer verwijderd!' };
}

export async function toggleTaskAction(eventId: string, taskId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = event.tasks || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].completed = !tasks[taskIndex].completed;

  await eventRef.update({ tasks, updatedAt: Timestamp.now() });
  return { success: true, message: 'Taak status bijgewerkt!' };
}