'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { getCurrentUser } from '@/lib/server/auth'; // Onze 'gold standard' auth functie!
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

// Schema voor de social links van een individuele gebruiker.
const socialLinksSchema = z.object({
  instagram: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  twitter: z.string().url().or(z.literal('')).optional(),
  tiktok: z.string().url().or(z.literal('')).optional(),
  pinterest: z.string().url().or(z.literal('')).optional(),
});

// State voor de useFormState hook
export type UpdateSocialsState = {
  success: boolean;
  message: string;
};

/**
 * Server Action om de social links van de INGELELOGDE GEBRUIKER te updaten.
 */
export async function updateUserSocialLinks(
  prevState: UpdateSocialsState,
  formData: FormData
): Promise<UpdateSocialsState> {
  // 1. Veilig de ingelogde gebruiker ophalen. Dit is de cruciale stap.
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: 'Niet geautoriseerd. Log opnieuw in.' };
  }

  const rawData = Object.fromEntries(formData);
  const validation = socialLinksSchema.safeParse(rawData);

  if (!validation.success) {
    console.error('Server-side validatie gefaald:', validation.error.format());
    return { success: false, message: 'De ingevulde gegevens zijn niet correct.' };
  }

  try {
    // 2. We bouwen het pad naar het document van de specifieke gebruiker.
    const userRef = adminDb.collection('users').doc(user.uid);

    const dataToUpdate: { [key: string]: string | FieldValue } = {};
    for (const [key, value] of Object.entries(validation.data)) {
      dataToUpdate[`socials.${key}`] = value ? value : FieldValue.delete();
    }

    // 3. We updaten het 'socials' veld binnen het document van de gebruiker.
    await userRef.update(dataToUpdate);

    // 4. Invalideer de cache voor deze specifieke pagina.
    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Je sociale profielen zijn succesvol bijgewerkt!' };
  } catch (error) {
    console.error(`❌ Fout bij updaten social links voor gebruiker ${user.uid}:`, error);
    return { success: false, message: 'Er is een onverwachte fout opgetreden.' };
  }
}