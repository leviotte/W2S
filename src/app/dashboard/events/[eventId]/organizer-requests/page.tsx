// src/app/dashboard/event/[id]/organizer-requests/page.tsx
import { adminDb } from "@/lib/server/firebase-admin";
import { ManageRequestsTable, ProcessedRequest } from "./_components/manage-requests-table";
import { notFound } from "next/navigation";

// Helper om gebruikersdata veilig op de server op te halen
async function getUserData(userId: string) {
  try {
    const userSnap = await adminDb.collection("users").doc(userId).get();
    if (!userSnap.exists) return null;
    const userData = userSnap.data();
    return {
      id: userSnap.id,
      firstName: userData?.firstName || "Onbekende",
      lastName: userData?.lastName || "Gebruiker",
      email: userData?.email || "Geen email",
      photoURL: userData?.photoURL || null,
    };
  } catch (error) {
    console.error(`Kon gebruiker ${userId} niet ophalen:`, error);
    return null;
  }
}

// De pagina is een Server Component
export default async function OrganizerRequestsPage({
  params,
}: {
  params: { id: string };
}) {
  const eventId = params.id;

  // 1. Haal alle requests voor dit event op
  const requestsSnap = await adminDb
    .collection("organizerRequests")
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "desc")
    .get();

  if (requestsSnap.empty) {
    // Rendert de lege staat in de tabel
  }

  // 2. Verwerk de requests en haal voor elke request de gebruikersdata op
  const processedRequests: ProcessedRequest[] = await Promise.all(
    requestsSnap.docs.map(async (doc) => {
      const requestData = doc.data();
      const userData = await getUserData(requestData.userId);

      // Fallback voor als user niet gevonden wordt
      const user = userData || {
        id: requestData.userId,
        firstName: "Verwijderde",
        lastName: "Gebruiker",
        email: "onbekend",
        photoURL: null,
      };

      return {
        id: doc.id,
        status: requestData.status || "pending",
        user: user,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deelnameverzoeken</h1>
        <p className="text-muted-foreground">
          Beheer hier de aanvragen van gebruikers die willen deelnemen aan je evenement.
        </p>
      </div>
      <ManageRequestsTable requests={processedRequests} eventId={eventId} />
    </div>
  );
}