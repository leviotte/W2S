// src/lib/server/data/events.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import type { Event } from '@/types/event'; // Zorg dat dit type correct is!
import { unstable_cache as cache } from 'next/cache';
import admin from 'firebase-admin';

export async function getEventsForUser(userId: string): Promise<Event[]> {
  if (!userId) return [];
  try {
    const eventsQuerySnapshot = await adminDb
      .collection('events')
      // Aanname: je wilt alle evenementen waar de gebruiker in zit, niet alleen die hij organiseert.
      .where('participantIds', 'array-contains', userId)
      .orderBy('date', 'desc')
      .get();

    if (eventsQuerySnapshot.empty) return [];

    const events = eventsQuerySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Converteer Firestore Timestamp naar een ISO string die serializeerbaar is.
        date: data.date.toDate().toISOString(),
      } as Event;
    });

    return events;
  } catch (error) {
    console.error('Error fetching events for user:', error);
    return [];
  }
}

// --- NIEUW TOEGEVOEGD (en gecached!) ---

export const getEventCountsForUser = cache(
  async (userId: string) => {
    try {
      if (!userId) return { onGoing: 0, past: 0, all: 0 };

      const eventsRef = adminDb.collection('events');
      const now = admin.firestore.Timestamp.now();

      // Queries correct opgebouwd
      const allQuery = eventsRef.where('organizerId', '==', userId);
      const onGoingQuery = eventsRef.where('organizerId', '==', userId).where('date', '>=', now);
      const pastQuery = eventsRef.where('organizerId', '==', userId).where('date', '<', now);
      
      const [allSnapshot, onGoingSnapshot, pastSnapshot] = await Promise.all([
        allQuery.count().get(),
        onGoingQuery.count().get(),
        pastQuery.count().get(),
      ]);

      return {
        all: allSnapshot.data().count,
        onGoing: onGoingSnapshot.data().count,
        past: pastSnapshot.data().count,
      };
    } catch (error) {
      console.error("❌ Error fetching event counts:", error);
      return { onGoing: 0, past: 0, all: 0 };
    }
  },
  ['event-counts'], // Base cache key
  { revalidate: 3600, tags: ['events'] } // Cache voor 1 uur
);