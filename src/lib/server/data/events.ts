// src/lib/server/data/events.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { eventSchema, type Event } from '@/types/event'; // Importeer schema en type
import { unstable_cache as cache } from 'next/cache';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Serialiseert een Firestore document met Timestamps naar een object met ISO strings.
 * Dit is essentieel om data door te geven van Server Components (met Date objecten)
 * naar Client Components (die alleen serialiseerbare data zoals strings accepteren).
 * @param doc De Firestore DocumentSnapshot.
 * @returns Een serialiseerbaar object.
 */
function serializeDoc(doc: admin.firestore.DocumentSnapshot): Record<string, any> | null {
    const data = doc.data();
    if (!data) return null;

    const serializedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Timestamp) {
            try {
                serializedData[key] = value.toDate().toISOString();
            } catch (e) {
                console.warn(`Invalid timestamp value for key ${key}:`, value);
                serializedData[key] = null;
            }
        } else {
            serializedData[key] = value;
        }
    }
    return { id: doc.id, ...serializedData };
}


/**
 * Haalt een specifiek event op basis van zijn ID uit Firestore.
 * @param eventId Het ID van het event.
 * @returns Een promise die resulteert in het event object of null als het niet gevonden of ongeldig is.
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return null;
    
    // Serialiseer en valideer met Zod voor ultieme typeveiligheid
    const serialized = serializeDoc(eventDoc);
    const parsedEvent = eventSchema.safeParse(serialized);

    if (!parsedEvent.success) {
      console.error(`Zod validation failed for event ${eventId}:`, parsedEvent.error.flatten());
      return null;
    }
    return parsedEvent.data;
  } catch (error) {
    console.error(`Fout bij het ophalen van event ${eventId}:`, error);
    throw new Error('Kon event data niet ophalen.');
  }
}

/**
 * Haalt alle events op waar een gebruiker aan deelneemt.
 * @param userId De ID van de gebruiker.
 * @returns Een promise die resulteert in een array van gevalideerde events.
 */
export async function getEventsForUser(userId: string): Promise<Event[]> {
  if (!userId) return [];
  try {
    const snapshot = await adminDb
      .collection('events')
      .where('participantIds', 'array-contains', userId)
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) return [];
    
    // Map, serialize, validate, en filter ongeldige events uit.
    return snapshot.docs
      .map(doc => {
          const serialized = serializeDoc(doc);
          const parsed = eventSchema.safeParse(serialized);
          if (parsed.success) {
              return parsed.data;
          }
          console.warn(`Zod validation failed for an event for user ${userId}:`, parsed.error.flatten());
          return null;
      })
      .filter((event): event is Event => event !== null);

  } catch (error) {
    console.error('Error fetching events for user:', error);
    return [];
  }
}

/**
 * Haalt event-tellingen (actueel, verleden, totaal) op voor een specifieke gebruiker.
 * @param userId De ID van de gebruiker (organisator).
 * @returns Een object met tellingen voor onGoing, past, en all events.
 */
export const getEventCountsForUser = cache(
  async (userId: string) => {
    try {
      if (!userId) return { onGoing: 0, past: 0, all: 0 };
      const eventsRef = adminDb.collection('events');
      const now = Timestamp.now();
      
      const allQuery = eventsRef.where('organizerId', '==', userId);
      // *** DE FIX ZIT HIER: 'onGoingQuery =' ontbrak ***
      const onGoingQuery = eventsRef.where('organizerId', '==', userId).where('date', '>=', now);
      const pastQuery = eventsRef.where('organizerId', '==', userId).where('date', '<', now);
      
      const [allSnap, onGoingSnap, pastSnap] = await Promise.all([
        allQuery.count().get(),
        onGoingQuery.count().get(),
        pastQuery.count().get(),
      ]);

      return {
        all: allSnap.data().count,
        onGoing: onGoingSnap.data().count,
        past: pastSnap.data().count,
      };
    } catch (error) {
      console.error("❌ Error fetching event counts:", error);
      return { onGoing: 0, past: 0, all: 0 };
    }
  },
  ['event-counts-for-user'],
  { revalidate: 3600, tags: ['events-count'] }
);