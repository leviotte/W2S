// src/app/dashboard/settings/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/actions';
import { adminDb, adminAuth } from '@/lib/server/firebase-admin';
import { userProfileSchema, socialLinksSchema, type SocialLinks } from '@/types/user';
import { passwordChangeSchema } from '@/lib/validators/settings';

// --- State Definities voor useFormState ---

export type PasswordFormState = {
  success: boolean;
  message: string;
  errors?: {
    newPassword?: string[];
    confirmNewPassword?: string[];
  };
};

export type ProfileInfoFormState = {
  success: boolean;
  message: string;
  errors?: {
    displayName?: string[];
    username?: string[];
  };
};

// --- Action 1: Wachtwoord Wijzigen (voor useFormState) ---

export async function updateUserPassword(
  prevState: PasswordFormState, 
  formData: FormData
): Promise<PasswordFormState> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, message: 'Authenticatie mislukt. Log opnieuw in.' };
  }

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

  try {
    await adminAuth.updateUser(session.user.id, { password: newPassword });
    return { success: true, message: 'Je wachtwoord is succesvol bijgewerkt.' };
  } catch (error) {
    console.error('Fout bij bijwerken van wachtwoord:', error);
    return { success: false, message: 'Er is een onverwachte serverfout opgetreden.' };
  }
}

// --- Action 2: Profiel Informatie Updaten (voor useFormState) ---
// Deze kun je later gebruiken met een vergelijkbaar formulier als de PasswordChangeSection

export async function updateProfileInfo(
    prevState: ProfileInfoFormState,
    formData: FormData
): Promise<ProfileInfoFormState> {
    const session = await getSession();
    if (!session?.user?.id) {
        return { success: false, message: 'Authenticatie mislukt.' };
    }

    const dataToUpdate = {
        displayName: formData.get('displayName'),
        username: formData.get('username'),
        isPublic: formData.get('isPublic') === 'on',
    };

    const validatedFields = userProfileSchema.pick({
        displayName: true,
        username: true,
        isPublic: true,
    }).safeParse(dataToUpdate);

    if (!validatedFields.success) {
        return { 
            success: false, 
            message: 'Ongeldige data.', 
            errors: validatedFields.error.flatten().fieldErrors 
        };
    }

    try {
        // CORRECTIE: We updaten de 'users' collectie, niet 'profiles'
        const userRef = adminDb.collection('users').doc(session.user.id);
        await userRef.update(validatedFields.data);

        revalidatePath('/dashboard/settings');
        if (validatedFields.data.username) {
            revalidatePath(`/profile/${validatedFields.data.username}`);
        }
        
        return { success: true, message: 'Profiel succesvol bijgewerkt.' };

    } catch (error) {
        console.error('Fout bij updaten profiel:', error);
        return { success: false, message: 'Gebruikersnaam is mogelijk al in gebruik.' };
    }
}


// --- Action 3: Sociale Links Updaten (voor direct aanroepen vanuit Client Component) ---

export async function updateSocialLinks(data: SocialLinks): Promise<{ success: boolean; message: string; }> {
    const session = await getSession();
    if (!session?.user?.id) {
        // Gebruik 'throw' zodat toast.promise de error kan vangen
        throw new Error('Authenticatie mislukt. Log opnieuw in.');
    }

    const validatedFields = socialLinksSchema.safeParse(data);
    if (!validatedFields.success) {
        throw new Error('Ongeldige links opgegeven.');
    }

    try {
        const userRef = adminDb.collection('users').doc(session.user.id);
        await userRef.update({
            socials: validatedFields.data // Update het geneste 'socials' object
        });
        
        revalidatePath('/dashboard/settings');
        if (session.user.username) {
            revalidatePath(`/profile/${session.user.username}`);
        }

        return { success: true, message: 'Sociale links succesvol opgeslagen!' };
    } catch (error) {
        console.error('Fout bij updaten social links:', error);
        throw new Error('Kon de links niet opslaan op de server.');
    }
}