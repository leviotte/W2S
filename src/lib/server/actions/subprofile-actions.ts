// src/lib/server/actions/subprofile-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/actions';
import type { SubProfile } from '@/types/user';

// ============================================================================
// SCHEMAS
// ============================================================================

const subProfileSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }).optional().nullable(),
  // ✅ FIX: Accepteer ook data URIs (base64 images)
  photoURL: z.string().optional().nullable(),
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
      // ✅ FIX: Firestore Date objects ipv ISO strings
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newProfileRef = await profilesRef.add(newProfileData);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profiles');
    revalidatePath('/dashboard/add-profile');

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
      error: error instanceof Error ? error.message : 'Kon het profiel niet aanmaken in de database.' 
    };
  }
}

// ============================================================================
// GET USER SUBPROFILES - ✅ MET EXPLICIETE RETURN TYPE
// ============================================================================

export async function getUserSubProfilesAction(): Promise<{
  success: boolean;
  error?: string;
  data: SubProfile[];
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.', data: [] };
  }

  try {
    const snapshot = await adminDb
      .collection('profiles')
      .where('userId', '==', session.user.id)
      .orderBy('createdAt', 'desc')
      .get();

    // ✅ EXPLICIT TYPE CAST - TypeScript weet nu wat dit is!
    const profiles: SubProfile[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || null,
        birthdate: data.birthdate || null,
        gender: data.gender || null,
        address: data.address || null,
        isPublic: data.isPublic ?? false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as SubProfile;
    });

    return { success: true, data: profiles };
  } catch (error) {
    console.error("Fout bij ophalen subprofielen:", error);
    return { success: false, error: 'Kon profielen niet ophalen.', data: [] };
  }
}

// ============================================================================
// GET SUBPROFILE BY ID
// ============================================================================

export async function getSubProfileByIdAction(profileId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Authenticatie vereist.', data: null };
  }

  try {
    const profileDoc = await adminDb.collection('profiles').doc(profileId).get();

    if (!profileDoc.exists) {
      return { success: false, error: 'Profiel niet gevonden.', data: null };
    }

    const profileData = profileDoc.data();
    
    // ✅ Security check: Only owner can view
    if (profileData?.userId !== session.user.id) {
      return { success: false, error: 'Geen toestemming.', data: null };
    }

    return { 
      success: true, 
      data: {
        id: profileDoc.id,
        ...profileData,
        createdAt: profileData.createdAt?.toDate?.() || new Date(),
        updatedAt: profileData.updatedAt?.toDate?.() || new Date(),
      }
    };
  } catch (error) {
    console.error("Fout bij ophalen subprofiel:", error);
    return { success: false, error: 'Kon profiel niet ophalen.', data: null };
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

    // ✅ FIX: Date object ipv ISO string
    updateData.updatedAt = new Date();

    await profileRef.update(updateData);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profiles');
    revalidatePath(`/dashboard/profiles/${profileId}`);

    return { success: true };
  } catch (error) {
    console.error("Fout bij updaten subprofiel:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon profiel niet updaten.' 
    };
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

    // ✅ TODO: Cleanup gerelateerde data (wishlists, events, etc.)
    // Before deleting, you might want to:
    // 1. Delete or reassign wishlists
    // 2. Remove from events
    // 3. Delete uploaded photos from storage

    await profileRef.delete();

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profiles');

    return { success: true };
  } catch (error) {
    console.error("Fout bij verwijderen subprofiel:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon profiel niet verwijderen.' 
    };
  }
}
