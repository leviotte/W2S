// VERBETERING: Dit is nu een Server Component! Sneller en veiliger.
import { getDocs, collection, query, where, Timestamp } from "firebase/firestore";
import { adminDb } from "@/lib/server/firebase-admin"; // Gebruik de admin SDK op de server
import { getCurrentUser } from "@/lib/server/auth"; // Server-side auth check
import { eventSchema } from "@/types/event";

import { PastEventsClientPage } from "./_components/past-events-client-page"; // We maken een client component voor de interactie

async function getPastEvents(userId: string) {
  try {
    const eventsRef = collection(adminDb, "events");
    const q = query(
      eventsRef,
      where(`participants.${userId}.id`, "==", userId), // Query of de user deelnemer is
      where("date", "<", Timestamp.now()) // Filter op events in het verleden
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => {
        const data = doc.data();
        const validation = eventSchema.safeParse({ ...data, id: doc.id });
        if(validation.success) {
            // Converteer Date objecten naar strings voor serialisatie
            return JSON.parse(JSON.stringify(validation.data));
        }
        return null;
    }).filter(Boolean);

    return events;
  } catch (error) {
    console.error("Failed to fetch past events:", error);
    return [];
  }
}

export default async function PastEventsPage() {
  const user = await getCurrentUser();
  if (!user) {
    // Redirect of foutmelding, afhankelijk van je logica
    return <div className="container mx-auto p-4"><p>Je moet ingelogd zijn om deze pagina te zien.</p></div>;
  }
  
  const pastEvents = await getPastEvents(user.id);

  // We geven de data door aan een client component die de interactie (routing, dialogs) afhandelt.
  return <PastEventsClientPage initialEvents={pastEvents} />;
}