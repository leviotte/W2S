// src/app/dashboard/event/[id]/page.tsx
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/server/firebase-admin";
import { getSession } from "@/lib/server/auth"; // Functie om server-side de user op te halen
import { eventSchema, Event } from "@/types/event";

// --- Componenten ---
import { EventDashboardClient } from "./_components/event-dashboard-client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Functie om event data op de server op te halen
async function getEventData(eventId: string): Promise<Event | null> {
  const eventRef = adminDb.collection("events").doc(eventId);
  const docSnap = await eventRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const data = { ...docSnap.data(), id: docSnap.id };
  const validation = eventSchema.safeParse(data);

  if (!validation.success) {
    console.error("Server-side event data validation failed:", validation.error);
    return null; // Of gooi een error
  }

  return validation.data;
}

export default async function EventDashboardPage({ params }: { params: { id: string }}) {
  const eventId = params.id;
  
  // Haal tegelijkertijd de data en de user sessie op
  const [initialEvent, currentUser] = await Promise.all([
    getEventData(eventId),
    getSession(), // Implementeer deze functie om je user op de server te krijgen
  ]);

  // Als het event niet bestaat, toon een 404 pagina.
  if (!initialEvent) {
    notFound();
  }
  
  // Toon een loading state als we de user nog niet hebben (optioneel)
  if (!currentUser) {
     return (
      <div className="flex h-screen items-center justify-center">
        {/* FIX: size prop is een string, geen number */}
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <EventDashboardClient 
      initialEvent={initialEvent}
      currentUser={currentUser}
    />
  );
}