'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore'; 
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/actions';
import { addressSchema, UserProfile, userProfileSchema } from '@/types/user';

// ====================================================================
// Type definities voor consistente responses
// ====================================================================

type ActionResponse<T> = 
  | { success: true; data: T } 
  | { success: false; error: string };

type FormState = {
  message: string;
  issues?: string[];
  success?: boolean;
};

type ToggleStatusResponse = 
  | { success: true; message: string; newStatus: boolean } 
  | { success: false; error: string };

// ====================================================================
// Zod Schemas voor Form Actions
// ====================================================================

const PersonalInfoUpdateSchema = userProfileSchema.pick({
  firstName: true,
  lastName: true,
});

const AddManagerSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  profileId: z.string(),
});

const RemoveManagerSchema = z.object({
  managerId: z.string(),
  profileId: z.string(),
});

// ====================================================================
// Helper Functies
// ====================================================================

async function getUserProfiles(ids: string[]): Promise<UserProfile[]> {
  if (ids.length === 0) return [];
  const userDocs = await Promise.all(ids.map(id => adminDb.collection('users').doc(id).get()));
  return userDocs
    .filter(doc => doc.exists)
    .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
}

// ====================================================================
// FORM ACTIONS (voor gebruik met de useFormState hook)
// ====================================================================

export async function updatePersonalInfo(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session?.user) return { message: 'Authenticatie mislukt.', success: false };

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  };

  const parsed = PersonalInfoUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = parsed.error.flatten();
    const allIssues = [...formErrors, ...Object.values(fieldErrors).flat()];
    return { message: 'Validatiefout.', issues: allIssues, success: false };
  }
  
  try {
    const { firstName, lastName } = parsed.data;
    const displayName = `${firstName} ${lastName}`.trim();
    const displayName_lowercase = displayName.toLowerCase();

    await adminDb.collection('users').doc(session.user.id).update({
      ...parsed.data,
      displayName,
      displayName_lowercase,
    });
    
    revalidatePath('/dashboard/profile');
    return { message: 'Gegevens succesvol bijgewerkt.', success: true };
  } catch (error) {
    console.error('Fout bij bijwerken persoonlijke gegevens:', error);
    return { message: 'Databasefout. Kon gegevens niet opslaan.', success: false };
  }
}

export async function updateAddress(prevState: FormState, formData: FormData): Promise<FormState> {
    const session = await getSession();
    if (!session?.user) return { message: 'Authenticatie mislukt.', success: false };
    
    const parsed = addressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
        const { formErrors, fieldErrors } = parsed.error.flatten();
        const allIssues = [...formErrors, ...Object.values(fieldErrors).flat()];
        return { message: 'Validatiefout.', issues: allIssues, success: false };
    }

    try {
        await adminDb.collection('users').doc(session.user.id).update({ address: parsed.data });
        revalidatePath('/dashboard/profile');
        return { message: 'Adres bijgewerkt.', success: true };
    } catch (error) {
        console.error('Fout bij bijwerken adres:', error);
        return { message: 'Databasefout. Kon adres niet opslaan.', success: false };
    }
}

export async function addManagerByEmailAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session?.user) return { message: 'Authenticatie mislukt.', success: false };

  const parsed = AddManagerSchema.safeParse({
    email: formData.get('email'),
    profileId: session.user.id,
  });

  if (!parsed.success) {
    return { message: 'Validatiefout.', issues: parsed.error.flatten().fieldErrors.email, success: false };
  }
  
  const { email, profileId } = parsed.data;

  try {
    const userQuery = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (userQuery.empty) {
      return { message: `Geen gebruiker gevonden met e-mailadres ${email}.`, success: false };
    }
    const managerDoc = userQuery.docs[0];
    const managerId = managerDoc.id;

    const result = await addManagerAction(profileId, managerId);
    if (!result.success) {
      return { message: result.error, success: false };
    }
    
    revalidatePath('/dashboard/profile');
    return { message: `Beheerder '${managerDoc.data().displayName}' succesvol toegevoegd.`, success: true };

  } catch (error) {
    console.error('Fout bij toevoegen beheerder via e-mail:', error);
    return { message: 'Databasefout. Kon beheerder niet toevoegen.', success: false };
  }
}

export async function removeManagerByIdAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const session = await getSession();
    if (!session?.user) return { message: 'Authenticatie mislukt.', success: false };

    const parsed = RemoveManagerSchema.safeParse({
        managerId: formData.get('managerId'),
        profileId: session.user.id,
    });

    if (!parsed.success) {
        return { message: 'Ongeldige data.', success: false };
    }

    const { managerId, profileId } = parsed.data;

    try {
        const result = await removeManagerAction(profileId, managerId);
        if (!result.success) {
            return { message: result.error, success: false };
        }

        revalidatePath('/dashboard/profile');
        return { message: 'Beheerder succesvol verwijderd.', success: true };
    } catch (error) {
        console.error('Fout bij verwijderen beheerder:', error);
        return { message: 'Databasefout. Kon beheerder niet verwijderen.', success: false };
    }
}

// ====================================================================
// ACTION VOOR DIRECTE AANROEP (bv. met useTransition)
// ====================================================================

export async function updatePhotoURL(photoURL: string): Promise<ActionResponse<null>> {
  const session = await getSession();
  if (!session?.user) return { success: false, error: 'Authenticatie mislukt.' };

  if (!z.string().url().safeParse(photoURL).success) {
      return { success: false, error: 'Ongeldige foto URL.' };
  }

  try {
      await adminDb.collection('users').doc(session.user.id).update({ photoURL });
      revalidatePath('/dashboard/profile');
      if (session.user.username) revalidatePath(`/profile/${session.user.username}`);
      return { success: true, data: null };
  } catch (error) {
      console.error('Fout bij bijwerken foto:', error);
      return { success: false, error: 'Databasefout. Kon foto niet opslaan.' };
  }
}

export async function togglePublicStatus(isPublic: boolean): Promise<ToggleStatusResponse> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: 'Authenticatie mislukt.' };
  }

  const newStatus = !!isPublic;

  try {
    await adminDb.collection('users').doc(session.user.id).update({
      isPublic: newStatus,
    });

    revalidatePath('/dashboard/profile');
    
    const message = newStatus ? 'Je profiel is nu publiek zichtbaar.' : 'Je profiel is nu privé.';
    return { success: true, message: message, newStatus: newStatus };

  } catch (error) {
    console.error('Fout bij het aanpassen van profiel zichtbaarheid:', error);
    return { success: false, error: 'Databasefout. Kon zichtbaarheid niet aanpassen.' };
  }
}

// ====================================================================
// PROGRAMMATISCHE ACTIONS (bv. voor custom hooks)
// ====================================================================

export async function getManagersForProfile(profileId: string): Promise<UserProfile[]> {
  const profileDoc = await adminDb.collection('users').doc(profileId).get();
  if (!profileDoc.exists) return [];
  const managerIds = profileDoc.data()?.managers || [];
  return getUserProfiles(managerIds);
}

export async function searchUsersAction(query: string): Promise<ActionResponse<UserProfile[]>> {
  if (!query) return { success: true, data: [] };
  
  const lowerCaseQuery = query.toLowerCase();
  const emailQuery = adminDb.collection('users').where('email', '>=', lowerCaseQuery).where('email', '<=', lowerCaseQuery + '\uf8ff').limit(5).get();
  const nameQuery = adminDb.collection('users').where('displayName_lowercase', '>=', lowerCaseQuery).where('displayName_lowercase', '<=', lowerCaseQuery + '\uf8ff').limit(5).get();

  try {
    const [emailSnap, nameSnap] = await Promise.all([emailQuery, nameQuery]);
    
    const results: Map<string, UserProfile> = new Map();
    emailSnap.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
    nameSnap.forEach(doc => results.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));

    return { success: true, data: Array.from(results.values()) };
  } catch (error) {
    console.error('Fout bij zoeken naar gebruikers:', error);
    return { success: false, error: 'Fout bij het zoeken naar gebruikers.' };
  }
}

export async function addManagerAction(profileId: string, managerId: string): Promise<ActionResponse<null>> {
  const session = await getSession();
  if (!session?.user || session.user.id !== profileId) {
    return { success: false, error: 'Ongeautoriseerd' };
  }
  if (profileId === managerId) {
    return { success: false, error: 'Je kan jezelf niet toevoegen.'};
  }

  const profileRef = adminDb.collection('users').doc(profileId);

  try {
    await profileRef.update({
      managers: FieldValue.arrayUnion(managerId),
    });

    revalidatePath('/dashboard/profile');
    return { success: true, data: null };
  } catch (e) {
    console.error('Fout bij toevoegen beheerder:', e);
    return { success: false, error: 'Kon beheerder niet toevoegen.' };
  }
}

export async function removeManagerAction(profileId: string, managerId: string): Promise<ActionResponse<null>> {
    const session = await getSession();
    if (!session?.user || session.user.id !== profileId) {
        return { success: false, error: 'Ongeautoriseerd' };
    }

    const profileRef = adminDb.collection('users').doc(profileId);
    
    try {
        await profileRef.update({
            managers: FieldValue.arrayRemove(managerId),
        });

        revalidatePath('/dashboard/profile');
        return { success: true, data: null };
    } catch (e) {
        console.error('Fout bij verwijderen beheerder:', e);
        return { success: false, error: 'Kon beheerder niet verwijderen.' };
    }
}