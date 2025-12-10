// src/app/dashboard/profile/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { findUserByEmail } from '@/lib/server/data/users';
import { AddressSchema, UserProfileSchema } from '@/types/user';

type FormState = {
  message: string;
  issues?: string[];
  success?: boolean;
};

// --- Update Personal Info ---
const PersonalInfoUpdateSchema = UserProfileSchema.pick({
  firstName: true,
  lastName: true,
  isPublic: true,
});

export async function updatePersonalInfo(prevState: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: 'Authenticatie mislukt.' };

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    isPublic: formData.get('isPublic') === 'on',
  };

  const parsed = PersonalInfoUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    // CORRECTIE: We verzamelen alle foutmeldingen uit het error-object.
    const { formErrors, fieldErrors } = parsed.error.flatten();
    const allIssues = [...formErrors, ...Object.values(fieldErrors).flat()];
    return {
      message: 'Validatiefout.',
      issues: allIssues,
    };
  }
  
  try {
    const { firstName, lastName } = parsed.data;
    const displayName = `${firstName} ${lastName}`.trim();

    await adminDb.collection('users').doc(user.id).update({
      ...parsed.data,
      displayName,
    });
    
    revalidatePath('/dashboard/profile');
    return { message: 'Gegevens succesvol bijgewerkt.', success: true };
  } catch (error) {
    return { message: 'Databasefout. Kon gegevens niet opslaan.' };
  }
}

// --- Update Address ---
export async function updateAddress(prevState: FormState, formData: FormData): Promise<FormState> {
    const user = await getCurrentUser();
    if (!user) return { message: 'Authenticatie mislukt.' };
    
    const parsed = AddressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
        // CORRECTIE: Ook hier verzamelen we alle foutmeldingen.
        const { formErrors, fieldErrors } = parsed.error.flatten();
        const allIssues = [...formErrors, ...Object.values(fieldErrors).flat()];
        return { message: 'Validatiefout.', issues: allIssues };
    }

    try {
        await adminDb.collection('users').doc(user.id).update({ address: parsed.data });
        revalidatePath('/dashboard/profile');
        return { message: 'Adres bijgewerkt.', success: true };
    } catch (error) {
        return { message: 'Databasefout. Kon adres niet opslaan.' };
    }
}

// --- Manager Actions ---
export async function addManager(prevState: FormState, formData: FormData): Promise<FormState> {
    const user = await getCurrentUser();
    if (!user) return { message: 'Authenticatie mislukt.' };

    const email = formData.get('email') as string;
    if (!z.string().email().safeParse(email).success) {
        return { message: 'Ongeldig e-mailadres.', issues: ['Voer een geldig e-mailadres in.'] };
    }

    const managerToAdd = await findUserByEmail(email);
    if (!managerToAdd) {
        return { message: 'Gebruiker niet gevonden.', issues: [`Geen gebruiker gevonden met e-mail: ${email}`] };
    }
    if(managerToAdd.id === user.id) {
        return { message: 'Je kan jezelf niet toevoegen.' };
    }
    if(user.managers.includes(managerToAdd.id)) {
        return { message: 'Deze gebruiker is al een beheerder.' };
    }

    try {
        const newManagers = [...user.managers, managerToAdd.id];
        await adminDb.collection('users').doc(user.id).update({ managers: newManagers });

        revalidatePath('/dashboard/profile');
        return { message: `${managerToAdd.displayName} is nu een beheerder.`, success: true };
    } catch (error) {
        return { message: 'Databasefout. Kon beheerder niet toevoegen.' };
    }
}

export async function removeManager(managerId: string): Promise<FormState & { success: boolean }> {
    const user = await getCurrentUser();
    if (!user) return { message: 'Authenticatie mislukt.', success: false };

    try {
        // CORRECTIE: 'id' expliciet als string typeren.
        const newManagers = user.managers.filter((id: string) => id !== managerId);
        await adminDb.collection('users').doc(user.id).update({ managers: newManagers });

        revalidatePath('/dashboard/profile');
        return { message: 'Beheerder verwijderd.', success: true };
    } catch (error) {
        return { message: 'Databasefout. Kon beheerder niet verwijderen.', success: false };
    }
}

// --- Update Photo ---
export async function updatePhotoURL(photoURL: string): Promise<FormState & { success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { message: 'Authenticatie mislukt.', success: false };

  if (!z.string().url().safeParse(photoURL).success) {
      return { message: 'Ongeldige foto URL.', success: false };
  }

  try {
      await adminDb.collection('users').doc(user.id).update({ photoURL });
      revalidatePath('/dashboard/profile');
      if(user.username) revalidatePath(`/profile/${user.username}`);
      return { message: 'Profielfoto bijgewerkt!', success: true };
  } catch (error) {
      console.error(error);
      return { message: 'Databasefout. Kon foto niet opslaan.', success: false };
  }
}