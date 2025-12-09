// src/lib/server/data/events.ts
import 'server-only';
import { adminDb } from '../firebase-admin';
import type { Event } from '@/types/event';

export async function getEventsForUser(userId: string): Promise<Event[]> {
  if (!userId) return [];

  try {
    const eventsQuerySnapshot = await adminDb
      .collection('events')
      .where('participantIds', 'array-contains', userId)
      .orderBy('date', 'desc')
      .get();

    if (eventsQuerySnapshot.empty) {
      return [];
    }

    // MENTOR-NOTITIE: Firestore data omzetten naar ons 'Event' type.
    const events = eventsQuerySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        //... andere velden uit 'data'
        ...data,
        date: data.date.toDate().toISOString(), // Converteer Timestamp naar ISO string
      } as Event;
    });

    return events;
  } catch (error) {
    console.error('Error fetching events for user:', error);
    return []; // Geef altijd een lege array terug bij een fout.
  }
}