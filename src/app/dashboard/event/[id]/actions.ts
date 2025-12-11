'use server';

import { revalidatePath } from 'next/cache';
// GECORRIGEERDE IMPORTS: We halen ALLES van de admin SDK.
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { eventUpdateSchema, Event } from '@/types/event';

// GOLD STANDARD HELPER: Deze functie is perfect, geen wijzigingen nodig.
function sanitizeForFirestore(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key in data) {
    const value = data[key];
    if (value instanceof Date) {
      // Gebruikt nu de correct geïmporteerde admin Timestamp
      sanitized[key] = Timestamp.fromDate(value);
    } else if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  delete sanitized.id;
  return sanitized;
}

// Jouw actie, ongewijzigd, want deze was al perfect.
export async function updateDrawnNameAction(
  eventId: string,
  userId: string,
  drawnParticipantId: string
) {
  if (!eventId || !userId || !drawnParticipantId) {
    return { success: false, message: 'Ongeldige data.' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update({
      [`drawnNames.${userId}`]: drawnParticipantId,
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: 'Naam succesvol getrokken!' };
  } catch (error) {
    console.error('Fout bij het updaten van getrokken naam:', error);
    return { success: false, message: 'Kon de getrokken naam niet opslaan.' };
  }
}

// Jouw generieke actie, met de correcte Timestamp.
export async function updateEventAction(
  eventId: string,
  dataToUpdate: Partial<Event>
) {
  if (!eventId) {
    return { success: false, message: 'Event ID ontbreekt.' };
  }

  const validation = eventUpdateSchema.safeParse(dataToUpdate);

  if (!validation.success) {
    console.error('Validatiefout bij event update:', validation.error.flatten());
    return { success: false, message: 'Ongeldige data voor update.' };
  }

  const sanitizedData = sanitizeForFirestore(validation.data);

  if (Object.keys(sanitizedData).length === 0) {
    return { success: true, message: 'Geen data om bij te werken.' };
  }

  // Gebruikt nu de correct geïmporteerde admin Timestamp
  sanitizedData.updatedAt = Timestamp.now();

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update(sanitizedData);

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true, message: 'Evenement bijgewerkt.' };
  } catch (error) {
    console.error('Fout bij het updaten van evenement:', error);
    return { success: false, message: 'Kon het evenement niet bijwerken.' };
  }
}