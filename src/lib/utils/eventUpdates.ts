/**
 * src/lib/utils/eventUpdates.ts
 *
 * Gecorrigeerde en geoptimaliseerde utility functies voor events.
 *
 * BELANGRIJKSTE VERBETERINGEN:
 * 1. PERFORMANCE: Gebruikt nu efficiënte Firestore `where` queries i.p.v. de hele 'events' collectie te fetchen.
 *    Dit bespaart drastisch op reads (en dus kosten) en is vele malen sneller.
 * 2. REFACTOR: De functies gebruiken nu `async/await` met een `return` statement i.p.v. verouderde callbacks.
 *    Dit maakt ze veel makkelijker te gebruiken in Server Components, API routes en hooks.
 * 3. TYPE SAFETY: Alle property-namen (`organizerId`, `senderId`) zijn gecorrigeerd om te matchen met de types.
 * 4. ROBUUSTHEID: De `sanitizeEventUpdate` is bijgewerkt om te voldoen aan het `ChatMessage` schema.
 */

import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Event, ChatMessage } from '@/types'; 
import { db } from '@/lib/client/firebase';

/**
 * Zorgt ervoor dat een (deel van een) event-object de juiste vorm heeft voor Firestore.
 * Voorkomt dat `undefined` waarden worden geschreven en stelt defaults in.
 */
export const sanitizeEventUpdate = (data: Partial<Event>): Partial<Event> => {
  const sanitized: Partial<Event> = {};

  // Verwijder alle 'undefined' keys
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof Event];
      if (value !== undefined) {
        (sanitized as any)[key] = value;
      }
    }
  }

  // Zorg ervoor dat berichten de correcte structuur hebben (indien aanwezig)
  if (sanitized.chat && Array.isArray(sanitized.chat)) {
    sanitized.chat = sanitized.chat.map((message: any): ChatMessage => ({
      id: message.id || crypto.randomUUID(),
      senderId: message.senderId, 
      senderName: message.senderName,
      senderAvatar: message.senderAvatar,
      timestamp: message.timestamp || new Date(),
      text: message.text || '',
      gif: message.gif || undefined,
      isRead: message.isRead ?? false,
      // << HIER IS DE FIX
      // We voegen de verplichte 'isAnonymous' property toe met een veilige fallback.
      isAnonymous: message.isAnonymous ?? false,
    }));
  }

  return sanitized;
};

/**
 * Telt het aantal events waar een gebruiker aan deelneemt (actieve en totaal).
 * Gebruikt nu een efficiënte query.
 */
export async function getParticipatedEventCount(
  userId: string
): Promise<{ onGoing: number; all: number }> {
  try {
    const now = Timestamp.now();
    const q = query(collection(db, 'events'), where(`participants.${userId}`, '!=', null));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { onGoing: 0, all: 0 };
    }

    const all = querySnapshot.size;
    let onGoing = 0; // Corrected typo

    querySnapshot.forEach((doc) => {
      const event = doc.data() as Event;
      if (event.date && new Date(event.date) >= now.toDate()) { // Added check for event.date
        onGoing++;
      }
    });

    return { onGoing, all };
  } catch (error) {
    console.error('Error fetching participated event count:', error);
    throw error; 
  }
}

/**
 * Telt het aantal events dat een gebruiker heeft georganiseerd.
 * Gebruikt nu een efficiënte query.
 */
export async function getOrganizedEventCount(
  userId: string
): Promise<{ onGoing: number; past: number; all: number }> {
  try {
    const now = Timestamp.now();
    const q = query(collection(db, 'events'), where('organizerId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return { onGoing: 0, past: 0, all: 0 };
    }

    const all = querySnapshot.size;
    let onGoing = 0; // Corrected typo

    querySnapshot.forEach((doc) => {
      const event = doc.data() as Event;
      if (event.date && new Date(event.date) >= now.toDate()) { // Added check for event.date
        onGoing++;
      }
    });

    const past = all - onGoing;
    return { onGoing, past, all };

  } catch (error) {
    console.error('Error fetching organized events count:', error);
    throw error;
  }
}