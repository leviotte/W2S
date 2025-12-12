'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/actions';

// ============================================================================
// SCHEMAS
// ============================================================================

const subProfileSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  photoURL: z.string().url().optional().nullable(),
});

type SubProfileData = z.infer<typeof subProfileSchema>;

// ============================================================================
// CREATE SUBPROFILE
// ============================================================================

export async function createSubProfileAction(data: unknown) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.' };
  }

  const validation = subProfileSchema.safeParse(data);
  if (!validation.success) {
    return { 
      success: false, 
      error: 'Ongeldige data.', 
      details: validation.error.flatten() 
    };
  }
  
  const profileData = validation.data;
  const displayName = `${profileData.firstName} ${profileData.lastName}`.trim();

  try {
    const profilesRef = adminDb.collection('profiles');
    
    const newProfileData = {
      ...profileData,
      userId: session.user.id,
      displayName,
      displayName_lowercase: displayName.toLowerCase(),
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newProfileRef = await profilesRef.add(newProfileData);

    revalidatePath('/dashboard/info');
    revalidatePath('/dashboard/profiles');

    return { 
      success: true, 
      data: { 
        id: newProfileRef.id, 
        ...newProfileData 
      } 
    };

  } catch (error) {
    console.error("Fout bij aanmaken subprofiel:", error);
    return { 
      success: false, 
      error: 'Kon het profiel niet aanmaken in de database.' 
    };
  }
}

// ============================================================================
// GET USER SUBPROFILES
// ============================================================================

export async function getUserSubProfilesAction() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.', data: [] };
  }

  try {
    const snapshot = await adminDb
      .collection('profiles')
      .where('userId', '==', session.user.id)
      .get();

    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: profiles };
  } catch (error) {
    console.error("Fout bij ophalen subprofielen:", error);
    return { success: false, error: 'Kon profielen niet ophalen.', data: [] };
  }
}

// ============================================================================
// UPDATE SUBPROFILE
// ============================================================================

export async function updateSubProfileAction(
  profileId: string, 
  updates: Partial<SubProfileData>
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.' };
  }

  try {
    const profileRef = adminDb.collection('profiles').doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return { success: false, error: 'Profiel niet gevonden.' };
    }

    const profileData = profileDoc.data();
    if (profileData?.userId !== session.user.id) {
      return { success: false, error: 'Geen toestemming.' };
    }

    // Update displayName if firstName or lastName changed
    const updateData: any = { ...updates };
    if (updates.firstName || updates.lastName) {
      const firstName = updates.firstName || profileData.firstName;
      const lastName = updates.lastName || profileData.lastName;
      updateData.displayName = `${firstName} ${lastName}`.trim();
      updateData.displayName_lowercase = updateData.displayName.toLowerCase();
    }

    updateData.updatedAt = new Date().toISOString();

    await profileRef.update(updateData);

    revalidatePath('/dashboard/profiles');
    revalidatePath(`/dashboard/profiles/${profileId}`);

    return { success: true };
  } catch (error) {
    console.error("Fout bij updaten subprofiel:", error);
    return { success: false, error: 'Kon profiel niet updaten.' };
  }
}

// ============================================================================
// DELETE SUBPROFILE
// ============================================================================

export async function deleteSubProfileAction(profileId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.' };
  }

  try {
    const profileRef = adminDb.collection('profiles').doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return { success: false, error: 'Profiel niet gevonden.' };
    }

    const profileData = profileDoc.data();
    if (profileData?.userId !== session.user.id) {
      return { success: false, error: 'Geen toestemming.' };
    }

    await profileRef.delete();

    revalidatePath('/dashboard/info');
    revalidatePath('/dashboard/profiles');

    return { success: true };
  } catch (error) {
    console.error("Fout bij verwijderen subprofiel:", error);
    return { success: false, error: 'Kon profiel niet verwijderen.' };
  }
}