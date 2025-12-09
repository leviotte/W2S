// src/lib/data/events.ts
import { adminDb } from '../server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import admin from 'firebase-admin'; // Importeer de 'admin' namespace

// Dit is de correcte, server-side manier met de Admin SDK
export const getEventCountsForUser = cache(
  async (userId: string) => {
    try {
      if (!userId) return { onGoing: 0, past: 0, all: 0 };

      // DE FIX: Gebruik de methode direct op de adminDb instantie
      const eventsRef = adminDb.collection('events');
      const now = admin.firestore.Timestamp.now(); // DE FIX: Gebruik de Timestamp van de admin SDK

      // DE FIX: Bouw queries door methodes te 'chainen'
      const allQuery = eventsRef.where('organizerId', '==', userId);
      const onGoingQuery = eventsRef.where('organizerId', '==', userId).where('date', '>=', now);
      const pastQuery = eventsRef.where('organizerId', '==', userId).where('date', '<', now);
      
      // DE FIX: Gebruik de .count().get() methode van de Admin SDK
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
  ['event-counts-for-user'], // Cache key
  { revalidate: 3600, tags: ['events', `events-user-${'${userId}'}`] } // Cache voor 1 uur, met user-specifieke tag
);