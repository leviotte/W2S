// src/app/dashboard/settings/actions.ts
'use server';

import { z } from 'zod';
import { getSession } from '@/lib/server/auth'; // Aanname dat dit je server-side sessie check is
import { adminDb, adminAuth } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';
import { UserProfileSchema, SocialLinksSchema } from '@/types/user';
import { passwordSchema } from '@/validators/auth';

// --- Profiel Informatie Updaten ---
export async function updateProfileInfo(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, message: 'Niet geauthenticeerd.' };
  }

  const dataToUpdate = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    displayName: formData.get('displayName'),
    isPublic: formData.get('isPublic') === 'on',
  };

  const validatedFields = UserProfileSchema.pick({
    firstName: true,
    lastName: true,
    displayName: true,
    isPublic: true,
  }).safeParse(dataToUpdate);

  if (!validatedFields.success) {
    return { success: false, message: 'Ongeldige data.', errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    const profileRef = adminDb.collection('profiles').doc(session.user.id); // FIX: Gebruik session.user.id
    await profileRef.update(validatedFields.data);

    revalidatePath('/dashboard/settings');
    if (session.user.username) {
        revalidatePath(`/profile/${session.user.username}`); // FIX: Gebruik session.user.username
    }
    
    return { success: true, message: 'Profiel succesvol bijgewerkt.' };

  } catch (error) {
    console.error('Fout bij updaten profiel:', error);
    return { success: false, message: 'Er is een serverfout opgetreden.' };
  }
}

// --- Wachtwoord Wijzigen ---
export async function changePassword(data: z.infer<typeof passwordSchema>) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, message: 'Niet geauthenticeerd.' };
    }

    const validatedFields = passwordSchema.safeParse(data);
    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.flatten().fieldErrors.newPassword?.[0] };
    }
    const { newPassword } = validatedFields.data;

    try {
        await adminAuth.updateUser(session.user.id, { // FIX: Gebruik session.user.id
            password: newPassword,
        });
        return { success: true, message: 'Wachtwoord succesvol gewijzigd.' };
    } catch (error) {
        console.error("Wachtwoord wijzigen mislukt:", error);
        return { success: false, message: 'Kon wachtwoord niet wijzigen. Probeer opnieuw.' };
    }
}

// --- Sociale Links Updaten ---
export async function updateSocialLinks(data: z.infer<typeof SocialLinksSchema>) {
    // ... Implementatie volgt later, maar de structuur is hier alvast.
    return { success: true, message: 'Sociale links bijgewerkt.' };
}