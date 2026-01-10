// src/app/dashboard/event/[id]/organizer-requests/actions.ts
"use server";

import { adminDb } from "@/lib/server/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

// Helper om user data op te halen
async function getUserData(userId: string) {
  const userSnap = await adminDb.collection("users").doc(userId).get();
  if (!userSnap.exists) return null;
  const userData = userSnap.data();
  return {
    id: userSnap.id,
    email: userData?.email || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    photoURL: userData?.photoURL || null,
  };
}

export async function handleRequestDecision(
  eventId: string,
  requestId: string,
  decision: "approved" | "rejected"
) {
  const requestRef = adminDb.collection("organizerRequests").doc(requestId);

  try {
    if (decision === "approved") {
      const requestSnap = await requestRef.get();
      if (!requestSnap.exists) throw new Error("Aanvraag niet gevonden.");
      
      const requestData = requestSnap.data();
      if (!requestData) throw new Error("Aanvraag data niet gevonden.");

      const userData = await getUserData(requestData.userId);
      if (!userData) throw new Error("Gebruiker niet gevonden.");

      const eventRef = adminDb.collection("events").doc(eventId);

      // Maak een nieuw deelnemer object aan
      const newParticipant = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        confirmed: true, // Automatisch bevestigd bij goedkeuring
      };
      
      // Update het event en de aanvraag in een batch voor atomiciteit
      const batch = adminDb.batch();
      batch.update(eventRef, {
        [`participants.${userData.id}`]: newParticipant,
      });
      batch.update(requestRef, { status: "approved" });
      await batch.commit();

      console.log(`✅ Verzoek ${requestId} goedgekeurd. Deelnemer ${userData.id} toegevoegd aan event ${eventId}.`);
    } else {
      // Als het verzoek wordt afgewezen
      await requestRef.update({ status: "rejected" });
      console.log(`❌ Verzoek ${requestId} afgewezen.`);
    }

    // Invalideer het pad om de UI te updaten
    revalidatePath(`/dashboard/event/${eventId}/organizer-requests`);
    return { success: true, message: `Verzoek succesvol ${decision}.` };

  } catch (error) {
    console.error(`Fout bij het verwerken van verzoek ${requestId}:`, error);
    return { success: false, message: "Er is een fout opgetreden." };
  }
}