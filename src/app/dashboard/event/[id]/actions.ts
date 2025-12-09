// src/app/dashboard/event/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { eventUpdateSchema, Event } from "@/types/event";

// GOLD STANDARD HELPER: Converteert data naar een Firestore-veilig formaat.
// Deze functie is cruciaal om runtime errors te voorkomen. Zod produceert
// Date objecten, maar Firestore heeft Timestamps nodig voor datumvelden.
function sanitizeForFirestore(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const key in data) {
    const value = data[key];
    if (value instanceof Date) {
      sanitized[key] = Timestamp.fromDate(value);
    } else if (value !== undefined) { // Voorkom dat 'undefined' wordt meegestuurd
      sanitized[key] = value;
    }
  }

  // Zorg ervoor dat 'id' nooit deel uitmaakt van een update payload.
  delete sanitized.id;

  return sanitized;
}


// Actie om een getrokken naam op te slaan (Jouw code, is perfect!)
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
      // GOEDE PRAKTIJK: Werk ook de 'namesDrawn' status bij als dit de eerste keer is.
      // namesDrawn: true, // Overweeg dit toe te voegen.
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: "Naam succesvol getrokken!" };
  } catch (error) {
    console.error("Fout bij het updaten van getrokken naam:", error);
    return { success: false, message: "Kon de getrokken naam niet opslaan." };
  }
}

// Generieke actie om eender welk veld van een event te updaten (Jouw code, geoptimaliseerd)
export async function updateEventAction(
  eventId: string,
  dataToUpdate: Partial<Event> // STERKERE TYPERING: Gebruik Partial<Event> i.p.v. 'unknown'
) {
  if (!eventId) {
    return { success: false, message: "Event ID ontbreekt." };
  }

  const validation = eventUpdateSchema.safeParse(dataToUpdate);

  if (!validation.success) {
    console.error("Validatiefout bij event update:", validation.error.flatten());
    return { success: false, message: "Ongeldige data voor update." };
  }

  // GEOPTIMALISEERD: Gebruik de sanitize-helper en voeg altijd een 'updatedAt' toe.
  const sanitizedData = sanitizeForFirestore(validation.data);
  
  if (Object.keys(sanitizedData).length === 0) {
      return { success: true, message: "Geen data om bij te werken." };
  }

  sanitizedData.updatedAt = Timestamp.now();

  try {
    const eventRef = adminDb.collection("events").doc(eventId);
    await eventRef.update(sanitizedData);

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: "Evenement bijgewerkt." };
  } catch (error) {
    console.error("Fout bij het updaten van evenement:", error);
    return { success: false, message: "Kon het evenement niet bijwerken." };
  }
}