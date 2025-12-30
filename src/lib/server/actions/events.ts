// src/lib/server/actions/events.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session.server';
import { Timestamp } from 'firebase-admin/firestore';
import {
  Event,
  EventParticipant,
  normalizeEvent,
  participantsToRecord,
  participantsToArray,
  tsToIso,
  isoToTs,
} from '@/types/event';

// =======================
// AUTH UTILITY
// =======================

function isLoggedInUser(user: any): user is { id: string } {
  return user && typeof user.id === 'string';
}

// =======================
// CREATE EVENT
// =======================

export async function createEventAction(eventData: Partial<Event>) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const userId = session.user.id;
  const eventId = crypto.randomUUID();

  // Zet deelnemers om naar array (Event type verwacht array)
  const participantsArr: EventParticipant[] = participantsToArray(eventData.participants);

  const startTS = isoToTs(eventData.startDateTime) ?? Timestamp.now();
  const endTS = isoToTs(eventData.endDateTime);
  const registrationDeadlineTS = isoToTs(eventData.registrationDeadline);

  const eventDoc: Event = {
    id: eventId,
    name: eventData.name?.trim() || 'Nieuw Evenement',
    startDateTime: tsToIso(startTS)!,
    endDateTime: endTS ? tsToIso(endTS)! : undefined,
    budget: eventData.budget ?? 0,
    organizer: userId,
    organizerId: userId,
    profileId: eventData.profileId ?? undefined,
    isLootjesEvent: eventData.isLootjesEvent ?? false,
    registrationDeadline: registrationDeadlineTS ? tsToIso(registrationDeadlineTS)! : undefined,
    maxParticipants: eventData.maxParticipants ?? 1000,
    participants: participantsArr,
    currentParticipantCount: participantsArr.length,
    backgroundImage:
      eventData.backgroundImage ??
      'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media',
    messages: [],
    lastReadTimestamps: {},
    drawnNames: {},
    tasks: [],
    allowSelfRegistration: eventData.allowSelfRegistration ?? false,
    isInvited: eventData.isInvited ?? false,
    isPublic: eventData.isPublic ?? false,
    createdAt: tsToIso(Timestamp.now())!,
    updatedAt: tsToIso(Timestamp.now())!,
    eventComplete: eventData.eventComplete ?? false,
    theme: eventData.theme ?? undefined,
    location: eventData.location ?? undefined,
    description: eventData.description ?? undefined,
    additionalInfo: eventData.additionalInfo ?? undefined,
    imageUrl: eventData.imageUrl ?? undefined,
  };

  await adminDb.collection('events').doc(eventId).set(eventDoc);

  return { success: true, message: 'Evenement aangemaakt!', eventId };
}

// =======================
// UPDATE EVENT
// =======================

export async function updateEventAction(eventId: string, updateData: Partial<Event>) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan updaten' };

  const dataToUpdate: Partial<Event> = {
    ...updateData,
    updatedAt: tsToIso(Timestamp.now())!,
  };

  if (updateData.startDateTime) dataToUpdate.startDateTime = updateData.startDateTime;
  if (updateData.endDateTime) dataToUpdate.endDateTime = updateData.endDateTime ?? null;
  if (updateData.registrationDeadline) dataToUpdate.registrationDeadline = updateData.registrationDeadline ?? null;

  await eventRef.update(dataToUpdate);

  return { success: true, message: 'Evenement bijgewerkt!' };
}

// =======================
// GET EVENT
// =======================

export async function getEventByIdAction(eventId: string): Promise<{ success: boolean; data?: Event }> {
  const doc = await adminDb.collection('events').doc(eventId).get();
  if (!doc.exists) return { success: false };

  const data = doc.data();
  if (!data) return { success: false };

  const normalized = normalizeEvent(data);
  return { success: true, data: normalized };
}

// =======================
// GET EVENTS FOR USER
// =======================

export async function getEventsForUser(userId: string): Promise<Event[]> {
  const eventsRef = adminDb.collection('events');

  const organizerSnapshot = await eventsRef.where('organizer', '==', userId).get();
  const allEventsSnapshot = await eventsRef.get();

  const eventsMap = new Map<string, any>();
  organizerSnapshot.docs.forEach(doc => eventsMap.set(doc.id, doc.data()));

  allEventsSnapshot.docs.forEach(doc => {
    const participants = doc.data()?.participants ?? {};
    if (participants[userId] && !eventsMap.has(doc.id)) eventsMap.set(doc.id, doc.data());
  });

  const events: Event[] = [];
  eventsMap.forEach(e => {
    const normalized = normalizeEvent(e);
    events.push(normalized);
  });

  return events.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
}

// =======================
// DELETE EVENT
// =======================

export async function deleteEventAction(eventId: string) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan verwijderen' };

  await eventRef.delete();
  return { success: true, message: 'Evenement verwijderd!' };
}

// =======================
// PARTICIPANT ACTIONS
// =======================

export async function registerParticipantAction(eventId: string, participant: EventParticipant) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const currentParticipants = doc.data()?.participants ?? {};
  const updatedParticipants = { ...currentParticipants, [participant.id]: participant };

  await eventRef.update({
    participants: updatedParticipants,
    currentParticipantCount: Object.keys(updatedParticipants).length,
    updatedAt: tsToIso(Timestamp.now())!,
  });

  return { success: true, message: 'Deelnemer geregistreerd!' };
}

// =======================
// TASK ACTIONS
// =======================

export async function updateEventTasksAction(eventId: string, tasks: any[]) {
  const session = await getSession();
  if (!isLoggedInUser(session?.user)) return { success: false, message: 'Niet geauthenticeerd' };

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan taken updaten' };

  await eventRef.update({ tasks, updatedAt: tsToIso(Timestamp.now())! });

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

  await eventRef.update({ tasks, updatedAt: tsToIso(Timestamp.now())! });
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

  await eventRef.update({ tasks, updatedAt: tsToIso(Timestamp.now())! });
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

  await eventRef.update({ tasks, updatedAt: tsToIso(Timestamp.now())! });
  return { success: true, message: 'Taak status bijgewerkt!' };
}
