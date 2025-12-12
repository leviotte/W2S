'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DeleteEventSchema = z.string().min(1, "Event ID is verplicht");

// ============================================================================
// GET EVENT COUNTS (voor dashboard)
// ============================================================================

export async function getEventCountsAction(userId: string): Promise<{
  upcoming: number;
  past: number;
}> {
  try {
    const now = new Date();
    
    const eventsSnapshot = await adminDb
      .collection('events')
      .where('organizerId', '==', userId)
      .get();

    let upcoming = 0;
    let past = 0;

    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const eventDate = data.date?.toDate?.() || new Date(data.date);
      
      if (eventDate >= now) {
        upcoming++;
      } else {
        past++;
      }
    });

    return { upcoming, past };
  } catch (error) {
    console.error('Error getting event counts:', error);
    return { upcoming: 0, past: 0 };
  }
}

// ============================================================================
// GET USER EVENTS
// ============================================================================

export async function getUserEventsAction(
  userId: string,
  filter?: 'upcoming' | 'past' | 'all'
): Promise<ActionResult<any[]>> {
  try {
    const now = new Date();
    
    const eventsSnapshot = await adminDb
      .collection('events')
      .where('organizerId', '==', userId)
      .orderBy('date', 'desc')
      .get();

    let events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    // Filter based on type
    if (filter === 'upcoming') {
      events = events.filter(e => e.date >= now);
    } else if (filter === 'past') {
      events = events.filter(e => e.date < now);
    }

    return { success: true, data: events };
  } catch (error) {
    console.error('Error getting user events:', error);
    return { success: false, error: 'Kon events niet ophalen' };
  }
}

// ============================================================================
// DELETE EVENT ACTION
// ============================================================================

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  try {
    // 1. Valideer de input
    const validation = DeleteEventSchema.safeParse(eventId);
    if (!validation.success) {
      return { success: false, error: 'Ongeldig event ID.' };
    }

    // 2. Haal de sessie van de gebruiker op
    const session = await getSession();
    const userId = session.user?.id;

    if (!session.isLoggedIn || !userId) {
      return { success: false, error: 'Authenticatie vereist.' };
    }

    // 3. Haal het event op
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden.' };
    }

    const eventData = eventDoc.data();

    // 4. Security check: Is de gebruiker de eigenaar?
    if (eventData?.organizerId !== userId) {
      return { success: false, error: 'Geen toestemming om dit event te verwijderen.' };
    }

    // 5. Voer de verwijdering uit
    await eventRef.delete();

    // 6. Invalideer de cache
    revalidatePath('/dashboard/event/past');
    revalidatePath('/dashboard/event/upcoming');
    revalidatePath('/dashboard/info');
    revalidatePath(`/event/${eventId}`);

    return { success: true, data: undefined };

  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: 'Er is een serverfout opgetreden.' };
  }
}

// ============================================================================
// GET EVENT BY ID
// ============================================================================

export async function getEventByIdAction(eventId: string): Promise<ActionResult<any>> {
  try {
    if (!eventId) {
      return { success: false, error: 'Event ID is verplicht' };
    }

    const eventDoc = await adminDb.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden' };
    }

    const data = eventDoc.data();
    const event = {
      id: eventDoc.id,
      ...data,
      date: data?.date?.toDate?.() || new Date(data?.date),
      createdAt: data?.createdAt?.toDate?.() || new Date(),
      updatedAt: data?.updatedAt?.toDate?.() || new Date(),
    };

    return { success: true, data: event };
  } catch (error) {
    console.error('Error getting event:', error);
    return { success: false, error: 'Kon event niet ophalen' };
  }
}

// ============================================================================
// UPDATE EVENT ACTION (voor toekomstig gebruik)
// ============================================================================

export async function updateEventAction(
  eventId: string,
  updates: Record<string, any>
): Promise<ActionResult> {
  try {
    const session = await getSession();
    const userId = session.user?.id;

    if (!session.isLoggedIn || !userId) {
      return { success: false, error: 'Authenticatie vereist.' };
    }

    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden.' };
    }

    const eventData = eventDoc.data();

    // Security check
    if (eventData?.organizerId !== userId) {
      return { success: false, error: 'Geen toestemming.' };
    }

    // Update event
    await eventRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    // Revalidate
    revalidatePath(`/event/${eventId}`);
    revalidatePath('/dashboard/event/past');
    revalidatePath('/dashboard/event/upcoming');

    return { success: true, data: undefined };

  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: 'Kon event niet bijwerken.' };
  }
}