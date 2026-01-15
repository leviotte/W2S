// src/lib/server/actions/events.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Timestamp } from 'firebase-admin/firestore';
import type { Event, CreateEventInput, EventFormData, EventParticipant } from '@/types/event';
import type { BackImages, Category } from '@/lib/server/types/event-admin';
import { normalizeEvent } from '@/lib/server/types/event-admin';
import { tsToIso } from '../firebase-timestamp';
import type { Wishlist } from '@/types/wishlist';
import { z } from 'zod';
import type { ServerEvent } from '@/lib/server/types/event-admin';

export const participantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
});

// =======================
// CREATE EVENT
// =======================
export async function createEventAction(eventData: CreateEventInput) {
  const session = await getServerSession(authOptions);
const user = session?.user;
if (!user?.id) return { success: false, message: 'Niet geauthenticeerd' };
const userId = user.id;

  const eventId = crypto.randomUUID();
  const now = await tsToIso(Timestamp.now())!;

  const eventDoc = {
    id: eventId,
    name: eventData.name.trim(),
    organizer: userId,
    organizerId: userId,
    startDateTime: eventData.startDateTime,
    endDateTime: eventData.endDateTime ?? null,
    location: eventData.location ?? null,
    theme: eventData.theme ?? null,
    backgroundImage: eventData.backgroundImage ?? null,
    additionalInfo: eventData.additionalInfo ?? null,
    organizerPhone: eventData.organizerPhone ?? null,
    organizerEmail: eventData.organizerEmail ?? null,
    budget: eventData.budget,
    maxParticipants: eventData.maxParticipants,
    isLootjesEvent: eventData.isLootjesEvent,
    isPublic: eventData.isPublic,
    allowSelfRegistration: eventData.allowSelfRegistration,
    participants: {} as Record<string, EventParticipant>,
    currentParticipantCount: 0,
    messages: [],
    tasks: [],
    drawnNames: {},
    lastReadTimestamps: {},
    createdAt: now,
    updatedAt: now,
    eventComplete: false,
  };

  await adminDb.collection('events').doc(eventId).set(eventDoc);
  return { success: true, eventId };
}

// =======================
// UPDATE EVENT
// =======================
export async function updateEventAction(
  eventId: string,
  data: Partial<EventFormData> & { exclusions?: Record<string, string[]> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: "Niet geauthenticeerd" };
  const userId = session.user.id;

  const eventRef = adminDb.collection("events").doc(eventId);
  const snap = await eventRef.get();
  if (!snap.exists) return { success: false, message: "Event niet gevonden" };

  const existingEvent = await normalizeEvent({ id: snap.id, ...snap.data() });
  if (existingEvent.organizer !== session.user.id)
    return { success: false, message: "Alleen de organizer kan updaten" };

  // Merge existingEvent + data, zodat je flexibel velden kunt updaten
  const updateDoc: Partial<Event> = {
    ...data,
    updatedAt: (await tsToIso(Timestamp.now())) || undefined,
  };

  await eventRef.update(updateDoc);
  return { success: true, message: "Evenement bijgewerkt!" };
}

// =======================
// GET EVENT
// =======================
export async function getEventByIdAction(
  eventId: string
): Promise<{ success: boolean; data?: ServerEvent }> {
  const doc = await adminDb.collection('events').doc(eventId).get();
  if (!doc.exists) return { success: false };
  const data = doc.data();
  if (!data) return { success: false };

  const normalized = await normalizeEvent({ id: doc.id, ...data });
  return { success: true, data: normalized };
}

// =======================
// GET EVENTS FOR USER
// =======================
export async function getEventsForUser(userId: string): Promise<ServerEvent[]> {
  const eventsRef = adminDb.collection('events');

  const organizerSnapshot = await eventsRef.where('organizer', '==', userId).get();
  const allEventsSnapshot = await eventsRef.get();

  const eventsMap = new Map<string, any>();
  organizerSnapshot.docs.forEach(doc => eventsMap.set(doc.id, doc.data()));
  allEventsSnapshot.docs.forEach(doc => {
    const participants = doc.data()?.participants ?? {};
    if (participants[userId] && !eventsMap.has(doc.id)) {
      eventsMap.set(doc.id, doc.data());
    }
  });

  const events: ServerEvent[] = [];
  for (const e of eventsMap.values()) {
    events.push(await normalizeEvent(e));
  }

  return events.sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() -
      new Date(b.startDateTime).getTime()
  );
}

// =======================
// DELETE EVENT
// =======================
export async function deleteEventAction(eventId: string) {
  const session = await getServerSession(authOptions);
if (!session?.user?.id) return { success: false, message: 'Niet geauthenticeerd' };
const userId = session.user.id;

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = await normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan verwijderen' };

  await eventRef.delete();
  return { success: true, message: 'Evenement verwijderd!' };
}

// =======================
// PARTICIPANT ACTIONS
// =======================
export async function addEventParticipantAction(
  eventId: string,
  participantData: z.infer<typeof participantSchema>
) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return { success: false, message: 'Event niet gevonden' };

  const existingParticipants = eventSnap.data()?.participants as Record<string, EventParticipant> ?? {};

  const newParticipant: EventParticipant = {
    id: crypto.randomUUID(),
    firstName: participantData.firstName,
    lastName: participantData.lastName,
    email: participantData.email || null,
    role: 'participant',
    status: 'accepted',
    confirmed: true,
    addedAt: new Date().toISOString(),
    wishlistId: undefined,
    photoURL: null,
  };

  existingParticipants[newParticipant.id] = newParticipant;

  await eventRef.update({
    participants: existingParticipants,
    currentParticipantCount: Object.keys(existingParticipants).length,
    updatedAt: await tsToIso(Timestamp.now())!,
  });

  return { success: true, participant: newParticipant };
}

export async function registerParticipantAction(eventId: string, participant: EventParticipant) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const currentParticipants = doc.data()?.participants as Record<string, EventParticipant> ?? {};
  const updatedParticipants = { ...currentParticipants, [participant.id]: participant };

  await eventRef.update({
    participants: updatedParticipants,
    currentParticipantCount: Object.keys(updatedParticipants).length,
    updatedAt: await tsToIso(Timestamp.now())!,
  });

  return { success: true, message: 'Deelnemer geregistreerd!' };
}
export async function deleteEventParticipantAction(
  eventId: string,
  participantId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) return { success: false, message: 'Event niet gevonden' };

    const participants = eventSnap.data()?.participants ?? {};
    if (!participants[participantId]) return { success: false, message: 'Deelnemer niet gevonden' };

    delete participants[participantId];

    await eventRef.update({
      participants,
      currentParticipantCount: Object.keys(participants).length,
      updatedAt: await tsToIso(Timestamp.now())!,
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Fout bij verwijderen deelnemer' };
  }
}

type RawTask = { id: string; assignedTo?: unknown; completed?: unknown };

function normalizeTasks(tasks: unknown[]): { id: string; assignedTo: string[]; completed: boolean }[] {
  if (!Array.isArray(tasks)) return [];

  // filter voor objects met id
  const rawTasks = tasks.filter((t): t is RawTask => !!t && typeof (t as any).id === 'string');

  return rawTasks.map(t => ({
    id: t.id,
    assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo.filter(a => typeof a === 'string') : [],
    completed: typeof t.completed === 'boolean' ? t.completed : false,
  }));
}

export async function updateEventTasksAction(eventId: string, tasks: unknown[]) {
  const session = await getServerSession(authOptions);
if (!session?.user?.id) return { success: false, message: 'Niet geauthenticeerd' };
const userId = session.user.id;

  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const existingEvent = await normalizeEvent({ id: doc.id, ...doc.data() });
  if (existingEvent.organizer !== session.user.id) return { success: false, message: 'Alleen de organizer kan taken updaten' };

  const normalizedTasks = normalizeTasks(tasks);
  await eventRef.update({ tasks: normalizedTasks, updatedAt: await tsToIso(Timestamp.now())! });
  return { success: true, message: 'Taken bijgewerkt!' };
}

export async function assignParticipantToTaskAction(eventId: string, taskId: string, participantId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = await normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = normalizeTasks(event.tasks ?? []);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].assignedTo = [...new Set([...tasks[taskIndex].assignedTo, participantId])];
  await eventRef.update({ tasks, updatedAt: await tsToIso(Timestamp.now())! });
  return { success: true, message: 'Deelnemer toegewezen!' };
}

export async function removeParticipantFromTaskAction(eventId: string, taskId: string, participantId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = await normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = normalizeTasks(event.tasks ?? []);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].assignedTo = tasks[taskIndex].assignedTo.filter(id => id !== participantId);
  await eventRef.update({ tasks, updatedAt: await tsToIso(Timestamp.now())! });
  return { success: true, message: 'Deelnemer verwijderd!' };
}

export async function toggleTaskAction(eventId: string, taskId: string) {
  const eventRef = adminDb.collection('events').doc(eventId);
  const doc = await eventRef.get();
  if (!doc.exists) return { success: false, message: 'Event niet gevonden' };

  const event = await normalizeEvent({ id: doc.id, ...doc.data() });
  const tasks = normalizeTasks(event.tasks ?? []);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return { success: false, message: 'Taak niet gevonden' };

  tasks[taskIndex].completed = !tasks[taskIndex].completed;
  await eventRef.update({ tasks, updatedAt: await tsToIso(Timestamp.now())! });
  return { success: true, message: 'Taak status bijgewerkt!' };
}

// =======================
// JOIN EVENT
// =======================
export async function joinEventAction(input: { eventId: string; profileId: string }) {
  const session = await getServerSession(authOptions);
if (!session?.user?.id) return { success: false, message: 'Niet geauthenticeerd' };
const userId = session.user.id;

  const { eventId, profileId } = input;
  const eventRef = adminDb.collection('events').doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return { success: false, error: 'Event niet gevonden' };

  const event = await normalizeEvent({ id: eventSnap.id, ...eventSnap.data() });
  if (event.participants[profileId]) return { success: false, error: 'Reeds deelnemer' };

  const profileSnap = await adminDb.collection('profiles').doc(profileId).get();
  if (!profileSnap.exists) return { success: false, error: 'Profiel niet gevonden' };

  const profile = profileSnap.data() as any;
  const now = (await tsToIso(Timestamp.now())) ?? new Date().toISOString();

  const participant: EventParticipant = {
    id: profileId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email ?? session.user.email,
    confirmed: true,
    role: 'participant',
    status: 'accepted',
    addedAt: now,
    wishlistId: undefined,
    photoURL: profile.photoURL ?? null,
  };

  return registerParticipantAction(eventId, participant);
}

// =======================
// GET EVENT OPTIONS
// =======================
export async function getEventOptionsAction() {
  const backImagesSnap = await adminDb.collection('EventBackImages').get();
  const categoriesSnap = await adminDb.collection('backgroundCategories').get();

  const backImages = backImagesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BackImages[];
  const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[];

  return { backImages, categories };
}

// =======================
// FETCH PARTICIPANTS WITH WISHLISTS
// =======================
export type FetchParticipantsResult =
  | { success: true; data: (EventParticipant & { wishlist?: any })[] }
  | { success: false; error: string };

export async function fetchEventParticipantsWithWishlists(
  eventId: string
): Promise<FetchParticipantsResult> {
  const eventRef = adminDb.collection('events').doc(eventId);
  const eventDoc = await eventRef.get();
  if (!eventDoc.exists) return { success: false, error: 'Event niet gevonden' };

  const participants = Object.values(eventDoc.data()?.participants || {}) as EventParticipant[];

  const enriched = await Promise.all(
    participants.map(async (p) => {
      if (!p.wishlistId) return p;
      const wishlistDoc = await adminDb.collection('wishlists').doc(p.wishlistId).get();
      const wishlistData = wishlistDoc.exists ? (wishlistDoc.data() as Wishlist) : undefined;
      return { ...p, wishlist: wishlistData };
    })
  );

  return { success: true, data: enriched };
}
export async function getOrganizedEventCount(userId: string) {
  if (!userId) return { onGoing: 0, past: 0, all: 0 };

  try {
    const snapshot = await adminDb
      .collection('events')
      .where('organizerId', '==', userId)
      .get();

    const now = Date.now();
    let onGoing = 0;
    let past = 0;

    snapshot.forEach(doc => {
      const dateValue = doc.data().date;
      const eventDate =
        typeof dateValue?.toMillis === 'function' ? dateValue.toMillis() : dateValue;
      if (eventDate >= now) onGoing++;
      else past++;
    });

    return {
      onGoing,
      past,
      all: snapshot.size,
    };
  } catch (error) {
    console.error('Error fetching organized event count:', error);
    return { onGoing: 0, past: 0, all: 0 };
  }
}