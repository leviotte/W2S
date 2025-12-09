// src/lib/utils/eventUpdates.ts
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../client/firebase';

// Dit is de correcte CLIENT-SIDE listener functie
export function getOrganizedEventCount(
  userId: string,
  callback: (counts: { onGoing: number; past: number; all: number }) => void
) {
  if (!userId) {
    return () => {}; // Geef een lege unsubscribe functie terug
  }

  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('organizerId', '==', userId));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const now = Timestamp.now();
    let onGoing = 0;
    let past = 0;

    snapshot.docs.forEach(doc => {
      const eventDate = doc.data().date as Timestamp;
      if (eventDate.toMillis() >= now.toMillis()) {
        onGoing++;
      } else {
        past++;
      }
    });
    
    callback({
      onGoing,
      past,
      all: snapshot.size,
    });
  }, (error) => {
    console.error("Error in real-time event count listener:", error);
  });

  // Belangrijk: geef de unsubscribe functie terug!
  return unsubscribe;
}