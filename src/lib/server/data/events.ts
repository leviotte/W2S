import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { eventSchema, type Event } from '@/types/event';
import { unstable_cache as cache } from 'next/cache';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Deze utility is perfect, die behouden we!
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

// Deze functies zijn prima en herbruikbaar, die blijven.
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) return null;
    
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

export async function getEventsForUser(userId: string): Promise<Event[]> {
  if (!userId) return [];
  try {
    const snapshot = await adminDb
      .collection('events')
      .where('participantIds', 'array-contains', userId)
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) return [];
    
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

// [FINALE, GECORRIGEERDE VERSIE]
// Telt 'upcoming' en 'past' events. Deze wrapper-functie lost het TypeScript-probleem op
// en zorgt voor correcte, dynamische caching per gebruiker.
export const getEventCountsForUser = (userId: string) => cache(
    async () => {
      if (!userId) {
        return { upcoming: 0, past: 0 };
      }

      try {
        const eventsRef = adminDb.collection('events');
        const now = Timestamp.now();

        // Query voor komende evenementen (als deelnemer)
        const upcomingQuery = eventsRef
          .where(`participants.${userId}.id`, '==', userId)
          .where('date', '>=', now);
        
        // Query voor afgelopen evenementen (als deelnemer)
        const pastQuery = eventsRef
          .where(`participants.${userId}.id`, '==', userId)
          .where('date', '<', now);
        
        const [upcomingSnapshot, pastSnapshot] = await Promise.all([
          upcomingQuery.count().get(),
          pastQuery.count().get(),
        ]);

        return {
          upcoming: upcomingSnapshot.data().count,
          past: pastSnapshot.data().count,
        };

      } catch (error) {
        console.error(`Error fetching event counts for user ${userId}:`, error);
        return { upcoming: 0, past: 0 };
      }
    },
    ['event-counts-for-user', userId], // Belangrijk: De userId is deel van de cache key!
    { 
      tags: [`user-events:${userId}`], // De tag is nu een correcte string array.
      revalidate: 300 
    }
)();