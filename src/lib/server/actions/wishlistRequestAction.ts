// src/lib/server/actions/wishlistRequestAction.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { nowTimestamp } from '@/lib/utils/time';

export interface WishlistRequestData {
  firstName: string;
  lastName: string;
}

export async function wishlistRequestAction(data: WishlistRequestData) {
  const first = data.firstName.trim().toLowerCase();
  const last = data.lastName.trim().toLowerCase();

  if (!first || !last) {
    return { success: false, error: 'Vul beide velden in.' };
  }

  try {
    // Zoek gebruiker
    const usersSnap = await adminDb
      .collection('users')
      .where('firstName_lower', '==', first)
      .where('lastName_lower', '==', last)
      .get();

    if (usersSnap.empty) {
      // Geen user → return info om invite dialog te tonen
      return { success: true, userFound: false, user: { firstName: data.firstName, lastName: data.lastName } };
    }

    if (usersSnap.docs.length > 1) {
      return { success: false, error: 'Meerdere mensen gevonden. Verfijn je zoekopdracht.' };
    }

    const userDoc = usersSnap.docs[0];

    await adminDb.collection('wishlistRequests').add({
      recipientId: userDoc.id,
      status: 'pending',
      createdAt: nowTimestamp(),
    });

    return { success: true, userFound: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Onverwachte fout opgetreden.' };
  }
}
