// src/lib/server/actions/events.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { eventSchema, type Event, type EventParticipant } from '@/types/event';
import type { TaskSerialized } from '@/types/task';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> = 
  | { success: true; data?: T; message?: string }
  | { success: false; error?: string; message?: string };

// ============================================================================
// HELPERS
// ============================================================================

/**
 * ✅ RECURSIVE Firestore Timestamp converter
 * Converts ALL Firestore Timestamps to ISO strings (for Client Components)
 */
function convertFirestoreTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Check if it's a Firestore Timestamp
  if (obj && typeof obj === 'object' && '_seconds' in obj && '_nanoseconds' in obj) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }
  
  // Firestore Timestamp object (has toDate method)
  if (obj?.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  
  // Recursively process arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertFirestoreTimestamps(item));
  }
  
  // Recursively process objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertFirestoreTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

function convertFirestoreDate(date: any): Date {
  if (date?.toDate) return date.toDate();
  if (typeof date === 'string') return new Date(date);
  if (date instanceof Date) return date;
  return new Date();
}

function sanitizeForFirestore(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const key in data) {
    const value = data[key];
    if (value instanceof Date) {
      sanitized[key] = Timestamp.fromDate(value);
    } else if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }
  
  delete sanitized.id;
  return sanitized;
}

function participantsArrayToMap(participants: EventParticipant[]): Record<string, EventParticipant> {
  return participants.reduce((acc, participant) => {
    acc[participant.id] = {
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email || '',
      confirmed: participant.confirmed || false,
      role: participant.role || 'participant', // ✅ ADDED
      status: participant.status || 'accepted', // ✅ ADDED
      addedAt: participant.addedAt || new Date().toISOString(), // ✅ ADDED
      wishlistId: participant.wishlistId || undefined,
      photoURL: participant.photoURL || undefined,
    };
    return acc;
  }, {} as Record<string, EventParticipant>);
}

// ============================================================================
// READ ACTIONS
// ============================================================================

/**
 * ✅ Get ALL events for a user (organizer OR participant)
 */
export async function getUserEventsAction(userId: string): Promise<ActionResult<Event[]>> {
  try {
    const eventsRef = adminDb.collection('events');

    // Parallel queries
    const [organizerSnapshot, allEventsSnapshot] = await Promise.all([
      eventsRef.where('organizer', '==', userId).get(),
      eventsRef.get(),
    ]);

    const eventMap = new Map<string, any>();

    // Add organizer events
    organizerSnapshot.forEach(doc => {
      const data = doc.data();
      eventMap.set(doc.id, { id: doc.id, ...data });
    });

    // Add participant events
    allEventsSnapshot.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || {};
      
      if (participants[userId]) {
        eventMap.set(doc.id, { id: doc.id, ...data });
      }
    });

    // ✅ Convert ALL Firestore Timestamps recursively!
    const events = Array.from(eventMap.values())
      .map(event => convertFirestoreTimestamps(event))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { success: true, data: events };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, error: 'Kon events niet laden' };
  }
}

/**
 * ✅ Legacy wrapper (voor backwards compatibility)
 */
export async function loadEventsAction() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Niet geauthenticeerd', events: [] };
  }

  const result = await getUserEventsAction(session.user.id);
  
  if (result.success) {
    return { success: true, events: result.data || [] };
  }
  
  return { success: false, message: result.error, events: [] };
}

/**
 * ✅ Get events by status (upcoming/ongoing/past)
 */
export async function getUserEventsByStatusAction(
  userId: string,
  status: 'upcoming' | 'ongoing' | 'past'
): Promise<ActionResult<Event[]>> {
  const result = await getUserEventsAction(userId);
  
  if (!result.success) return result;

  const now = new Date();
  const filtered = (result.data || []).filter(event => {
    const eventDate = new Date(event.date);
    const isToday = eventDate.toDateString() === now.toDateString();
    const isPast = eventDate < now && !isToday;
    const isUpcoming = eventDate > now;

    switch (status) {
      case 'upcoming': return isUpcoming;
      case 'ongoing': return isToday;
      case 'past': return isPast;
      default: return true;
    }
  });

  return { success: true, data: filtered };
}

/**
 * ✅ Get event counts (dashboard stats)
 */
export async function getEventCountsAction(userId: string): Promise<{
  upcoming: number;
  past: number;
  onGoing: number;
  all: number;
}> {
  try {
    const result = await getUserEventsAction(userId);
    
    if (!result.success) {
      return { upcoming: 0, past: 0, onGoing: 0, all: 0 };
    }

    const now = new Date();
    let upcoming = 0;
    let past = 0;

    (result.data || []).forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= now) {
        upcoming++;
      } else {
        past++;
      }
    });

    return { upcoming, past, onGoing: upcoming, all: result.data?.length || 0 };
  } catch (error) {
    return { upcoming: 0, past: 0, onGoing: 0, all: 0 };
  }
}

/**
 * ✅ Get single event by ID
 */
export async function getEventByIdAction(eventId: string): Promise<ActionResult<Event>> {
  try {
    if (!eventId) {
      return { success: false, error: 'Event ID ontbreekt' };
    }

    const eventDoc = await adminDb.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden' };
    }

    const rawData = { id: eventDoc.id, ...eventDoc.data()! };
    
    // ✅ Convert ALL Firestore Timestamps recursively!
    const event = convertFirestoreTimestamps(rawData);

    return { success: true, data: event };
  } catch (error) {
    console.error('Error fetching event:', error);
    return { success: false, error: 'Kon event niet laden' };
  }
}

/**
 * ✅ Legacy wrapper
 */
export async function getEventAction(eventId: string) {
  const result = await getEventByIdAction(eventId);
  
  if (result.success) {
    return { success: true, event: result.data };
  }
  
  return { success: false, message: result.error, event: null };
}

// ============================================================================
// CREATE ACTION
// ============================================================================

export async function createEventAction(eventData: Partial<Event>) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Niet geauthenticeerd' };
  }

  try {
    const eventId = crypto.randomUUID();
    const userId = session.user.id;
    
    let participantsMap: Record<string, EventParticipant> = {};
    
    if (Array.isArray(eventData.participants)) {
      participantsMap = participantsArrayToMap(eventData.participants);
    } else if (eventData.participants) {
      participantsMap = eventData.participants as Record<string, EventParticipant>;
    }
    
    const eventDoc = {
      name: eventData.name || 'Nieuw Evenement',
      date: typeof eventData.date === 'string' 
        ? eventData.date 
        : Timestamp.fromDate(new Date(eventData.date || new Date())),
      time: eventData.time || null,
      budget: eventData.budget || 0,
      organizerId: userId,
      organizer: userId,
      profileId: eventData.profileId || null,
      isLootjesEvent: eventData.isLootjesEvent || false,
      registrationDeadline: eventData.registrationDeadline
        ? (typeof eventData.registrationDeadline === 'string'
            ? eventData.registrationDeadline
            : Timestamp.fromDate(new Date(eventData.registrationDeadline)))
        : null,
      maxParticipants: eventData.maxParticipants || 1000,
      participants: participantsMap,
      backgroundImage: eventData.backgroundImage || 
        'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media&token=992cff28-16cd-4264-be7e-46c2bb8b8a56',
      messages: [],
      lastReadTimestamps: {},
      drawnNames: {},
      tasks: [],
      allowSelfRegistration: eventData.allowSelfRegistration || false,
      currentParticipantCount: Object.keys(participantsMap).length,
      isInvited: eventData.isInvited || false,
      isPublic: eventData.isPublic || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await adminDb.collection('events').doc(eventId).set(eventDoc);
    
    revalidatePath('/dashboard/event/upcoming');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Evenement aangemaakt!', eventId };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, message: 'Fout bij aanmaken van evenement' };
  }
}

// ============================================================================
// UPDATE ACTIONS
// ============================================================================

export async function updateEventAction(
  eventId: string,
  dataToUpdate: Partial<Event>
): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, message: 'Event ID ontbreekt' };
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, message: 'Niet geauthenticeerd' };
  }

  const sanitizedData = sanitizeForFirestore(dataToUpdate);
  
  if (Object.keys(sanitizedData).length === 0) {
    return { success: true, message: 'Geen data om bij te werken' };
  }

  sanitizedData.updatedAt = Timestamp.now();

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update(sanitizedData);
    
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Evenement bijgewerkt' };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, message: 'Fout bij updaten van evenement' };
  }
}

export async function updateDrawnNameAction(
  eventId: string,
  userId: string,
  drawnParticipantId: string
) {
  if (!eventId || !userId || !drawnParticipantId) {
    return { success: false, message: 'Ongeldige data' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update({
      [`drawnNames.${userId}`]: drawnParticipantId,
      updatedAt: Timestamp.now(),
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    
    return { success: true, message: 'Naam succesvol getrokken!' };
  } catch (error) {
    console.error('Error updating drawn name:', error);
    return { success: false, message: 'Kon de getrokken naam niet opslaan' };
  }
}

// ============================================================================
// DELETE ACTION
// ============================================================================

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, message: 'Event ID ontbreekt' };
  }

  const session = await getSession();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Niet geauthenticeerd' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return { success: false, message: 'Evenement niet gevonden' };
    }
    
    const eventData = eventDoc.data();
    
    if (eventData?.organizerId !== session.user.id && eventData?.organizer !== session.user.id) {
      return { success: false, message: 'Alleen de organisator kan dit evenement verwijderen' };
    }
    
    await eventRef.delete();
    
    revalidatePath('/dashboard/event/past');
    revalidatePath('/dashboard/event/upcoming');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Evenement verwijderd' };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, message: 'Fout bij verwijderen van evenement' };
  }
}

// ============================================================================
// PARTICIPANT ACTIONS
// ============================================================================

export async function addParticipantAction(
  eventId: string,
  participant: EventParticipant
) {
  if (!eventId || !participant?.id) {
    return { success: false, message: 'Ongeldige data' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return { success: false, message: 'Evenement niet gevonden' };
    }
    
    const eventData = eventDoc.data() as any;
    const currentParticipants = eventData.participants || {};
    
    if (currentParticipants[participant.id]) {
      return { success: false, message: 'Deelnemer bestaat al' };
    }
    
    if (eventData.maxParticipants && Object.keys(currentParticipants).length >= eventData.maxParticipants) {
      return { success: false, message: 'Maximum aantal deelnemers bereikt' };
    }
    
    await eventRef.update({
      [`participants.${participant.id}`]: {
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email || '',
        confirmed: participant.confirmed || false,
        role: participant.role || 'participant', // ✅ ADDED
        status: participant.status || 'accepted', // ✅ ADDED
        addedAt: participant.addedAt || new Date().toISOString(), // ✅ ADDED
        wishlistId: participant.wishlistId || undefined,
        photoURL: participant.photoURL || undefined,
      },
      currentParticipantCount: Object.keys(currentParticipants).length + 1,
      updatedAt: Timestamp.now(),
    });
    
    revalidatePath(`/dashboard/events/${eventId}`);
    
    return { success: true, message: 'Deelnemer toegevoegd' };
  } catch (error) {
    console.error('Error adding participant:', error);
    return { success: false, message: 'Fout bij toevoegen van deelnemer' };
  }
}

export async function removeParticipantAction(eventId: string, participantId: string) {
  if (!eventId || !participantId) {
    return { success: false, message: 'Ongeldige data' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return { success: false, message: 'Evenement niet gevonden' };
    }
    
    const eventData = eventDoc.data() as any;
    const currentParticipants = eventData.participants || {};
    
    if (!currentParticipants[participantId]) {
      return { success: false, message: 'Deelnemer niet gevonden' };
    }
    
    delete currentParticipants[participantId];
    
    await eventRef.update({
      participants: currentParticipants,
      currentParticipantCount: Object.keys(currentParticipants).length,
      updatedAt: Timestamp.now(),
    });
    
    revalidatePath(`/dashboard/events/${eventId}`);
    
    return { success: true, message: 'Deelnemer verwijderd' };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, message: 'Fout bij verwijderen van deelnemer' };
  }
}

// ============================================================================
// TASK ACTIONS (PARTY PREPS)
// ============================================================================

/**
 * ✅ UPDATED: Accept TaskSerialized[] (ISO strings)
 */
export async function updateEventTasksAction(
  eventId: string,
  tasks: TaskSerialized[]
): Promise<ActionResult> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    
    // ✅ Convert ISO strings to Firestore Timestamps
    const tasksForFirestore = tasks.map(task => ({
      ...task,
      createdAt: Timestamp.fromDate(new Date(task.createdAt)),
    }));

    await eventRef.update({
      tasks: tasksForFirestore,
      updatedAt: Timestamp.now(),
    });

    revalidatePath(`/dashboard/events/${eventId}`);

    return { success: true, message: 'Tasks bijgewerkt' };
  } catch (error) {
    console.error('Error updating tasks:', error);
    return { success: false, message: 'Kon tasks niet bijwerken' };
  }
}

export async function assignParticipantToTaskAction(
  eventId: string, 
  taskId: string, 
  participantId: string
): Promise<ActionResult> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, message: 'Event niet gevonden' };
    }

    const eventData = eventDoc.data();
    const tasks = (eventData?.tasks || []) as any[];

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const assignedParticipants = task.assignedParticipants || [];
        if (!assignedParticipants.includes(participantId)) {
          return {
            ...task,
            assignedParticipants: [...assignedParticipants, participantId],
          };
        }
      }
      return task;
    });

    await eventRef.update({
      tasks: updatedTasks,
      updatedAt: Timestamp.now(),
    });

    revalidatePath(`/dashboard/events/${eventId}`);

    return { success: true, message: 'Taak toegewezen!' };
  } catch (error) {
    console.error('Error assigning participant:', error);
    return { success: false, message: 'Kon taak niet toewijzen' };
  }
}

export async function removeParticipantFromTaskAction(
  eventId: string, 
  taskId: string, 
  participantId: string
): Promise<ActionResult> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, message: 'Event niet gevonden' };
    }

    const eventData = eventDoc.data();
    const tasks = (eventData?.tasks || []) as any[];

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const assignedParticipants = task.assignedParticipants || [];
        return {
          ...task,
          assignedParticipants: assignedParticipants.filter(
            (id: string) => id !== participantId
          ),
        };
      }
      return task;
    });

    await eventRef.update({
      tasks: updatedTasks,
      updatedAt: Timestamp.now(),
    });

    revalidatePath(`/dashboard/events/${eventId}`);

    return { success: true, message: 'Deelnemer verwijderd' };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, message: 'Kon deelnemer niet verwijderen' };
  }
}

export async function toggleTaskAction(
  eventId: string,
  taskId: string
): Promise<ActionResult> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, message: 'Event niet gevonden' };
    }

    const eventData = eventDoc.data();
    const tasks = (eventData?.tasks || []) as any[];

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    await eventRef.update({
      tasks: updatedTasks,
      updatedAt: Timestamp.now(),
    });

    revalidatePath(`/dashboard/events/${eventId}`);

    return { success: true, message: 'Taak status bijgewerkt' };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { success: false, message: 'Kon status niet bijwerken' };
  }
}