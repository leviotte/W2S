// src/app/dashboard/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import { getCurrentUser } from '@/lib/server/auth';

type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
};

export async function updateSocialLinksAction(formData: SocialLinks) {
  try {
    const currentUser = await getCurrentUser();
    // DE FIX: Checken op 'profile'
    if (!currentUser?.profile.id) {
      throw new Error('Niet geautoriseerd');
    }

    // DE FIX: currentUser.profile.id gebruiken!
    const userRef = adminDb.collection('users').doc(currentUser.profile.id);

    const linksToUpdate = { /* ... je update logica ... */ };
    await userRef.set({ socials: linksToUpdate }, { merge: true });

    revalidatePath('/dashboard/settings');
    revalidatePath(`/profile/${currentUser.profile.username}`); // Ook profielpagina revalideren!

    return { success: true, message: 'Social links opgeslagen!' };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return { success: false, error: errorMessage };
  }
}

// Hulpfunctie om data te laden in de page.tsx
export async function getUserSocials(userId: string) {
    if (!userId) return null;
    const doc = await adminDb.collection('users').doc(userId).get();
    const data = doc.data();
    return data?.socials || null;
}