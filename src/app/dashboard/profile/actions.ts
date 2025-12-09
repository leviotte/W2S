// src/app/dashboard/profile/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { getCurrentUser } from '@/lib/auth/actions';
import { uploadFileToStorage } from '@/lib/server/storage';
import { 
  profileInfoSchema, 
  profileAddressSchema, 
  profilePublicStatusSchema 
} from '@/lib/validators/profile';
import { FieldValue } from 'firebase-admin/firestore'; // <-- Belangrijke import
import type { UserProfile } from '@/types/user'; // <-- Import voor type

// Een generiek type voor de form state
type FormState = { success: boolean; message: string; };

async function getAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user?.profile.id) {
    throw new Error('Niet geautoriseerd.');
  }
  return user;
}

const photoUploadSchema = z.object({
  photo: z.instanceof(File)
    .refine(file => file.size > 0, 'Selecteer een bestand.')
    .refine(file => file.size < 4 * 1024 * 1024, 'Bestand is te groot (max 4MB).')
    .refine(file => file.type.startsWith('image/'), 'Enkel afbeeldingsbestanden (JPG, PNG, WEBP) zijn toegestaan.'),
});

// --- BESTAANDE ACTIES ---

export async function updatePersonalInfoAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // ... (geen wijzigingen hier)
  try {
    const user = await getAuthenticatedUser();
    const validated = profileInfoSchema.safeParse(Object.fromEntries(formData));
    
    if (!validated.success) {
      console.error(validated.error.flatten().fieldErrors);
      return { success: false, message: 'Ongeldige gegevens. Controleer alle velden.' };
    }

    await adminDb.collection('users').doc(user.profile.id).update(validated.data);

    revalidatePath('/dashboard/profile');
    if (user.profile.username) revalidatePath(`/profile/${user.profile.username}`);
    
    return { success: true, message: 'Persoonlijke gegevens opgeslagen!' };
  } catch (error) {
    console.error("Update Personal Info Error:", error);
    return { success: false, message: 'Kon gegevens niet opslaan. Probeer het opnieuw.' };
  }
}

export async function updateAddressAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // ... (geen wijzigingen hier)
  try {
    const user = await getAuthenticatedUser();
    const validated = profileAddressSchema.safeParse({ 
      address: {
          street: formData.get('address.street'),
          city: formData.get('address.city'),
          postalCode: formData.get('address.postalCode'),
          country: formData.get('address.country'),
      } 
    });

    if (!validated.success) {
      console.error(validated.error.flatten().fieldErrors);
      return { success: false, message: 'Ongeldig adres. Controleer alle velden.' };
    }

    await adminDb.collection('users').doc(user.profile.id).set(validated.data, { merge: true });

    revalidatePath('/dashboard/profile');
    
    return { success: true, message: 'Adres opgeslagen!' };
  } catch (error) {
    console.error("Update Address Error:", error);
    return { success: false, message: 'Kon adres niet opslaan. Probeer het opnieuw.' };
  }
}

export async function togglePublicStatusAction(prevState: FormState, formData: FormData): Promise<FormState> {
    // ... (geen wijzigingen hier)
    try {
        const user = await getAuthenticatedUser();
        const validated = profilePublicStatusSchema.safeParse({
            isPublic: formData.get('isPublic') === 'true'
        });

        if (!validated.success) {
            return { success: false, message: 'Ongeldige waarde.' };
        }

        await adminDb.collection('users').doc(user.profile.id).update({
            isPublic: validated.data.isPublic
        });

        revalidatePath('/dashboard/profile');
        if (user.profile.username) revalidatePath(`/profile/${user.profile.username}`);

        const message = validated.data.isPublic ? 'Profiel is nu publiek.' : 'Profiel is nu privé.';
        return { success: true, message };
    } catch (error) {
        console.error("Toggle Public Status Error:", error);
        return { success: false, message: 'Kon zichtbaarheid niet aanpassen.' };
    }
}

export async function updatePhotoAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // ... (kleine correctie hier)
  try {
    const user = await getAuthenticatedUser();
    
    const validated = photoUploadSchema.safeParse({ photo: formData.get('photo') });
    if (!validated.success) {
      const errorMessage = validated.error.flatten().fieldErrors.photo?.[0] ?? 'Ongeldig bestand.';
      return { success: false, message: errorMessage };
    }

    const { photo } = validated.data;

    // Correctie: `destinationPath` was `destinati`
    const destinationPath = `profile-pictures/${user.profile.id}.${photo.name.split('.').pop()}`;
    
    const photoURL = await uploadFileToStorage(photo, destinationPath);

    await adminDb.collection('users').doc(user.profile.id).update({ photoURL });

    revalidatePath('/dashboard/profile');
    if (user.profile.username) revalidatePath(`/profile/${user.profile.username}`);

    return { success: true, message: 'Profielfoto succesvol opgeslagen!' };
  } catch (error) {
    console.error('Photo upload failed:', error);
    return { success: false, message: 'Kon de foto niet uploaden. Serverfout.' };
  }
}

// --- NIEUWE ACTIES VOOR PROFIELBEHEER ---

export async function searchUsersAction(emailQuery: string, currentManagerIds: string[]): Promise<UserProfile[]> {
  if (!emailQuery || emailQuery.length < 3) return [];
  
  const user = await getAuthenticatedUser();
  
  const usersRef = adminDb.collection('users');
  const snapshot = await usersRef
    .where('email', '>=', emailQuery.toLowerCase())
    .where('email', '<=', emailQuery.toLowerCase() + '\uf8ff')
    .limit(5)
    .get();

  if (snapshot.empty) return [];

  const results = snapshot.docs.map(doc => doc.data() as UserProfile);

  return results.filter(foundUser => 
    foundUser.id !== user.profile.id && !currentManagerIds.includes(foundUser.id)
  );
}

export async function addManagerAction(formData: FormData): Promise<FormState> {
  const managerId = formData.get('managerId') as string;
  if (!managerId) return { success: false, message: 'Geen gebruiker geselecteerd.' };

  try {
    const user = await getAuthenticatedUser();
    const mainProfileId = user.profile.id;

    const batch = adminDb.batch();

    const mainProfileRef = adminDb.collection('users').doc(mainProfileId);
    batch.update(mainProfileRef, { manages: FieldValue.arrayUnion(managerId) });

    const managerProfileRef = adminDb.collection('users').doc(managerId);
    batch.update(managerProfileRef, { managedBy: FieldValue.arrayUnion(mainProfileId) });

    await batch.commit();

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'Beheerder succesvol toegevoegd.' };
  } catch (error) {
    console.error("Add manager error:", error);
    return { success: false, message: 'Kon beheerder niet toevoegen.' };
  }
}

export async function removeManagerAction(formData: FormData): Promise<FormState> {
    const managerId = formData.get('managerId') as string;
    if (!managerId) return { success: false, message: 'Geen gebruiker geselecteerd.' };

    try {
        const user = await getAuthenticatedUser();
        const mainProfileId = user.profile.id;

        const batch = adminDb.batch();

        const mainProfileRef = adminDb.collection('users').doc(mainProfileId);
        batch.update(mainProfileRef, { manages: FieldValue.arrayRemove(managerId) });

        const managerProfileRef = adminDb.collection('users').doc(managerId);
        batch.update(managerProfileRef, { managedBy: FieldValue.arrayRemove(mainProfileId) });

        await batch.commit();

        revalidatePath('/dashboard/profile');
        return { success: true, message: 'Beheerder verwijderd.' };
    } catch (error) {
        console.error("Remove manager error:", error);
        return { success: false, message: 'Kon beheerder niet verwijderen.' };
    }
}