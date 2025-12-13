// src/app/dashboard/upcoming/_components/actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { getCurrentUser } from '@/lib/auth/actions';
import { revalidatePath } from 'next/cache';

export async function deleteEventAction(eventId: string): Promise<{ success: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return { success: false, message: 'Niet geautoriseerd' };
  }

  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    const eventData = eventDoc.data();

    // SECURITY CHECK: Alleen de organisator mag verwijderen.
    if (!eventDoc.exists || eventData?.organizerId !== currentUser.id) {
      return { success: false, message: 'Geen toestemming om dit evenement te verwijderen.' };
    }

    await eventRef.delete();

    // Revalideer het pad zodat de pagina opnieuw wordt geladen met verse data.
    revalidatePath('/dashboard/upcoming');
    return { success: true, message: 'Evenement verwijderd.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Onbekende serverfout.' };
  }
}