// src/app/dashboard/event/past/page.tsx
import { redirect } from 'next/navigation';
import { adminDb } from "@/lib/server/firebase-admin";
import { getCurrentUser } from "@/lib/auth/actions";
import { eventSchema, type Event } from "@/types/event";
import { Timestamp } from 'firebase-admin/firestore'; // Belangrijk: import van admin SDK!

// We verplaatsen de interactieve logica naar een Client Component.
import { PastEventsClientPage } from "./_components/past-events-client-page";

async function getPastEvents(userId: string): Promise<Event[]> {
  try {
    const eventsRef = adminDb.collection("events");
    
    // DE FIX: Dit is de correcte query-syntax voor de Firebase Admin SDK.
    const snapshot = await eventsRef
      .where(`participants.${userId}.id`, "==", userId)
      .where("date", "<", Timestamp.now())
      .get();

    if (snapshot.empty) {
      return [];
    }

    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      // DE FIX: Zorg ervoor dat data een object is voordat we het valideren.
      if (typeof data !== 'object' || data === null) return null;

      const validation = eventSchema.safeParse({ ...data, id: doc.id });
      
      if (validation.success) {
        // Converteer Date objecten en Timestamps naar ISO strings voor serialisatie.
        // Dit is een veilige manier om data van server naar client te sturen.
        return JSON.parse(JSON.stringify(validation.data));
      } else {
        console.warn(`Event ${doc.id} heeft ongeldige data:`, validation.error.flatten());
        return null;
      }
    }).filter((event): event is Event => event !== null); // Type guard om nulls te filteren

    return events;
  } catch (error) {
    console.error("Fout bij ophalen van afgelopen evenementen:", error);
    return [];
  }
}

export default async function PastEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    // We gebruiken de ID van de ingelogde gebruiker. Zonder gebruiker, geen data.
    return redirect('/?modal=login&callbackUrl=/dashboard/event/past');
  }
  
  const pastEvents = await getPastEvents(currentUser.id);

  // We geven de data door aan een client component die de interactie afhandelt.
  return <PastEventsClientPage initialEvents={pastEvents} currentUserId={currentUser.id} />;
}
