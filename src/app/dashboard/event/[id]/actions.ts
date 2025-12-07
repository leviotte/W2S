// src/app/dashboard/event/[id]/actions.ts
"use server";

import { adminDb } from "@/lib/server/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { eventUpdateSchema } from "@/types/event"; // We gebruiken een schema voor veilige updates

// Actie om een getrokken naam op te slaan
export async function updateDrawnNameAction(
  eventId: string,
  userId: string,
  drawnParticipantId: string
) {
  if (!eventId || !userId || !drawnParticipantId) {
    return { success: false, message: "Ongeldige data." };
  }

  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    await eventRef.update({
      [`drawnNames.${userId}`]: drawnParticipantId,
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: "Naam succesvol getrokken!" };
  } catch (error) {
    console.error("Fout bij het updaten van getrokken naam:", error);
    return { success: false, message: "Kon de getrokken naam niet opslaan." };
  }
}

// Generieke actie om eender welk veld van een event te updaten
export async function updateEventAction(
  eventId: string,
  dataToUpdate: unknown
) {
  if (!eventId) {
    return { success: false, message: "Event ID ontbreekt." };
  }

  // Valideer de data die we willen updaten tegen een (partieel) schema
  const validation = eventUpdateSchema.safeParse(dataToUpdate);

  if (!validation.success) {
    console.error("Validatiefout bij event update:", validation.error);
    return { success: false, message: "Ongeldige data voor update." };
  }

  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    await eventRef.update(validation.data);

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: "Evenement bijgewerkt." };
  } catch (error) {
    console.error("Fout bij het updaten van evenement:", error);
    return { success: false, message: "Kon het evenement niet bijwerken." };
  }
}