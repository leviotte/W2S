// src/app/dashboard/events/[id]/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { revalidatePath, revalidateTag } from '@/lib/utils/revalidate'; // ✅ GEFIXED
import { eventSchema, eventUpdateSchema, type Event, type EventParticipant } from '@/types/event';
import { z } from 'zod';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
      wishlistId: participant.wishlistId || undefined,
      photoURL: participant.photoURL || undefined,
    };
    return acc;
  }, {} as Record<string, EventParticipant>);
}

// ============================================================================
// READ ACTIONS
// ============================================================================

export async function loadEventsAction() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return { success: false, message: 'Niet geauthenticeerd', events: [] };
  }

  try {
    const userId = session.user.id;
    const eventsRef = adminDb.collection('events');
    
    const organizerQuery = eventsRef.where('organizerId', '==', userId);
    const organizerSnapshot = await organizerQuery.get();
    
    const allEventsSnapshot = await eventsRef.get();
    
    const eventsMap = new Map<string, Event>();
    
    organizerSnapshot.docs.forEach(doc => {
      const data = doc.data();
      eventsMap.set(doc.id, { 
        id: doc.id, 
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        registrationDeadline: data.registrationDeadline?.toDate() || undefined,
      } as Event);
    });
    
    allEventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const participants = data.participants || {};
      
      if (participants[userId]) {
        eventsMap.set(doc.id, { 
          id: doc.id, 
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          registrationDeadline: data.registrationDeadline?.toDate() || undefined,
        } as Event);
      }
    });
    
    const events = Array.from(eventsMap.values());
    
    return { success: true, events };
  } catch (error) {
    console.error('Error loading events:', error);
    return { success: false, message: 'Fout bij laden van evenementen', events: [] };
  }
}

export async function getEventAction(eventId: string) {
  if (!eventId) {
    return { success: false, message: 'Event ID ontbreekt', event: null };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return { success: false, message: 'Evenement niet gevonden', event: null };
    }
    
    const data = eventDoc.data()!;
    const event: Event = { 
      id: eventDoc.id, 
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      registrationDeadline: data.registrationDeadline?.toDate() || undefined,
    } as Event;
    
    return { success: true, event };
  } catch (error) {
    console.error('Error getting event:', error);
    return { success: false, message: 'Fout bij ophalen van evenement', event: null };
  }
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
    
    // Convert participants to map if they're an array
    let participantsMap: Record<string, EventParticipant> = {};
    
    if (Array.isArray(eventData.participants)) {
      participantsMap = participantsArrayToMap(eventData.participants);
    } else if (eventData.participants) {
      participantsMap = eventData.participants as Record<string, EventParticipant>;
    }
    
    const eventDoc = {
      name: eventData.name || 'Nieuw Evenement',
      date: Timestamp.fromDate(eventData.date || new Date()),
      time: eventData.time || null,
      budget: eventData.budget || 0,
      organizerId: userId,
      organizer: userId, // For backward compatibility
      profileId: eventData.profileId || null,
      isLootjesEvent: eventData.isLootjesEvent || false,
      registrationDeadline: eventData.registrationDeadline 
        ? Timestamp.fromDate(eventData.registrationDeadline) 
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
    
    // ✅ GEFIXED - Next.js 16 API
    revalidatePath('/dashboard/event/upcoming');
    revalidatePath('/dashboard');
    revalidateTag('events');
    
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
) {
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
    
    // ✅ GEFIXED - Next.js 16 API
    revalidatePath(`/dashboard/event/${eventId}`);
    revalidatePath('/dashboard');
    revalidateTag('events');
    
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

    revalidatePath(`/dashboard/event/${eventId}`);
    
    return { success: true, message: 'Naam succesvol getrokken!' };
  } catch (error) {
    console.error('Error updating drawn name:', error);
    return { success: false, message: 'Kon de getrokken naam niet opslaan' };
  }
}

// ============================================================================
// DELETE ACTION
// ============================================================================

export async function deleteEventAction(eventId: string) {
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
    revalidateTag('events');
    
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
        wishlistId: participant.wishlistId || undefined,
        photoURL: participant.photoURL || undefined,
      },
      currentParticipantCount: Object.keys(currentParticipants).length + 1,
      updatedAt: Timestamp.now(),
    });
    
    revalidatePath(`/dashboard/event/${eventId}`);
    
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
    
    revalidatePath(`/dashboard/event/${eventId}`);
    
    return { success: true, message: 'Deelnemer verwijderd' };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, message: 'Fout bij verwijderen van deelnemer' };
  }
}