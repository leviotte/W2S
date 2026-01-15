// src/app/dashboard/settings/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { adminDb, adminAuth } from '@/lib/server/firebase-admin';
import { userProfileSchema, socialLinksSchema, type SocialLinks } from '@/types/user';
import { passwordChangeSchema } from '@/lib/validators/settings';
import type { AuthenticatedSessionUser } from '@/types/session';

/* ============================================================================
 * Helper: Haal ingelogde gebruiker op via NextAuth en Firebase
 * ========================================================================== */
async function getAuthenticatedUser(): Promise<AuthenticatedSessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Authenticatie mislukt. Log opnieuw in.');
  }

  const id = session.user.id;
  const email = session.user.email ?? '';
  const nameFallback = session.user.name ?? email.split('@')[0];

  // Haal extra info uit Firebase
  const userDoc = await adminDb.collection('users').doc(id).get();
  const userData = userDoc.exists ? userDoc.data() : {};

  return {
    isLoggedIn: true,
    id,
    email,
    displayName: nameFallback,
    isAdmin: userData?.isAdmin ?? false,
    isPartner: userData?.isPartner ?? false,
    firstName: userData?.firstName ?? '',
    lastName: userData?.lastName ?? '',
    photoURL: userData?.photoURL ?? null,
    username: userData?.username ?? null,
    createdAt: userData?.createdAt?.toMillis?.(),
    lastActivity: userData?.lastActivity?.toMillis?.(),
  };
}

/* ============================================================================
 * Action: Wachtwoord Wijzigen
 * ========================================================================== */
export async function updateUserPassword(
  prevState: { success: boolean; message: string; errors?: Record<string, string[]> },
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: Record<string, string[]> }> {
  try {
    const user = await getAuthenticatedUser();

    const rawData = Object.fromEntries(formData.entries());
    const parsed = passwordChangeSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validatiefout. Controleer de ingevulde velden.',
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { newPassword } = parsed.data;

    await adminAuth.updateUser(user.id, { password: newPassword });

    return { success: true, message: 'Je wachtwoord is succesvol bijgewerkt.' };
  } catch (error: any) {
    console.error('Fout bij bijwerken van wachtwoord:', error);
    return { success: false, message: error.message || 'Er is een onverwachte serverfout opgetreden.' };
  }
}

/* ============================================================================
 * Action: Profiel Informatie Updaten
 * ========================================================================== */
export async function updateProfileInfo(
  prevState: { success: boolean; message: string; errors?: Record<string, string[]> },
  formData: FormData
): Promise<{ success: boolean; message: string; errors?: Record<string, string[]> }> {
  try {
    const user = await getAuthenticatedUser();

    const dataToUpdate = {
      displayName: formData.get('displayName')?.toString() ?? '',
      username: formData.get('username')?.toString() ?? '',
      isPublic: formData.get('isPublic') === 'on',
    };

    const validatedFields = userProfileSchema
      .pick({ displayName: true, username: true, isPublic: true })
      .safeParse(dataToUpdate);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Ongeldige data.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const userRef = adminDb.collection('users').doc(user.id);
    await userRef.update(validatedFields.data);

    revalidatePath('/dashboard/settings');
    if (validatedFields.data.username) {
      revalidatePath(`/profile/${validatedFields.data.username}`);
    }

    return { success: true, message: 'Profiel succesvol bijgewerkt.' };
  } catch (error: any) {
    console.error('Fout bij updaten profiel:', error);
    return { success: false, message: error.message || 'Gebruikersnaam is mogelijk al in gebruik.' };
  }
}

/* ============================================================================
 * Action: Sociale Links Updaten
 * ========================================================================== */
export async function updateSocialLinks(
  data: SocialLinks
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getAuthenticatedUser();

    const validatedFields = socialLinksSchema.safeParse(data);
    if (!validatedFields.success) {
      throw new Error('Ongeldige links opgegeven.');
    }

    const userRef = adminDb.collection('users').doc(user.id);
    await userRef.update({ socials: validatedFields.data });

    revalidatePath('/dashboard/settings');
    if (user.username) {
      revalidatePath(`/profile/${user.username}`);
    }

    return { success: true, message: 'Sociale links succesvol opgeslagen!' };
  } catch (error: any) {
    console.error('Fout bij updaten social links:', error);
    throw new Error(error.message || 'Kon de links niet opslaan op de server.');
  }
}
