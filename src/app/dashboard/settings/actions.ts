/**
 * src/app/dashboard/settings/actions.ts
 * 
 * Server Actions voor de instellingenpagina van het dashboard.
 * Deze functies worden veilig op de server uitgevoerd met de Firebase ADMIN SDK.
 */
'use server';

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore'; // <-- DE JUISTE IMPORT!
import { revalidatePath } from 'next/cache';

import { adminAuth, adminDb, adminStorage } from '@/lib/server/firebaseAdmin';
import { getAuthenticatedUser } from '@/lib/auth/utils';

// Zod schema voor validatie op de server
const socialLinksSchema = z.object({
  instagram: z.string().url('Ongeldige Instagram URL').or(z.literal('')).optional(),
  facebook: z.string().url('Ongeldige Facebook URL').or(z.literal('')).optional(),
  twitter: z.string().url('Ongeldige Twitter URL').or(z.literal('')).optional(),
  tiktok: z.string().url('Ongeldige TikTok URL').or(z.literal('')).optional(),
  pinterest: z.string().url('Ongeldige Pinterest URL').or(z.literal('')).optional(),
});

export type UpdateSocialsState = {
  success: boolean;
  message: string;
};

export async function updateSocialLinks(
  previousState: UpdateSocialsState,
  formData: FormData
): Promise<UpdateSocialsState> {
  const { db } = adminAuth, adminDb, adminStorage();
  const user = await getAuthenticatedUser();

  if (!user) {
    return { success: false, message: 'Authenticatie mislukt. Log opnieuw in.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = socialLinksSchema.safeParse(rawData);

  if (!validation.success) {
    console.error('Validatiefout social links:', validation.error.flatten().fieldErrors);
    return { success: false, message: 'Validatiefout. Controleer de ingevoerde URLs.' };
  }
  
  const { instagram, facebook, twitter, tiktok, pinterest } = validation.data;

  try {
    // CORRECTE ADMIN SDK SYNTAX: db.collection().doc()
    const userProfileRef = db.collection('users').doc(user.uid);
    
    // CORRECTE ADMIN SDK SYNTAX: .set() op de referentie
    await userProfileRef.set({
      socials: {
        instagram: instagram || null,
        facebook: facebook || null,
        twitter: twitter || null,
        tiktok: tiktok || null,
        pinterest: pinterest || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Revalidate de relevante paden
    revalidatePath('/dashboard/settings');
    if (user.username) {
      revalidatePath(`/profile/${user.username}`);
    }

    return { success: true, message: 'Sociale media links succesvol bijgewerkt!' };

  } catch (error) {
    console.error('Fout bij het updaten van social links:', error);
    return { success: false, message: 'Er is een serverfout opgetreden. Probeer het later opnieuw.' };
  }
}