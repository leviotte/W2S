// src/lib/firebase/server/profiles.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { UserProfile } from '@/types/user';
import { Timestamp } from 'firebase-admin/firestore';
import type { SubProfile } from '@/types/user';

// ----------------------------
// SubProfile DB Actions
// ----------------------------
export async function createSubProfile(
  userId: string,
  data: Omit<SubProfile, 'id'>
) {
  const docRef = await adminDb
    .collection('users')
    .doc(userId)
    .collection('subProfiles')
    .add(data);

  return { id: docRef.id, ...data };
}

export async function updateSubProfile(userId: string, subProfileId: string, data: Partial<SubProfile>) {
  await adminDb.collection('users').doc(userId)
    .collection('subProfiles').doc(subProfileId).update(data);
}

export async function deleteSubProfile(userId: string, subProfileId: string) {
  await adminDb.collection('users').doc(userId)
    .collection('subProfiles').doc(subProfileId).delete();
}

export async function getSubProfiles(userId: string) {
  const snap = await adminDb.collection('users').doc(userId)
    .collection('subProfiles').get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubProfile[];
}
// ============================================================================
// PROFILE MANAGERS
// ============================================================================

export interface ProfileManager {
  userId: string;
  email: string;
  displayName?: string;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Get all managers who can access this profile (SERVER ONLY)
 */
export async function getProfileManagers(userId: string): Promise<ProfileManager[]> {
  try {
    const managersSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('profileManagers')
      .get();

    return managersSnapshot.docs.map((doc) => {
      const data = doc.data();
      const grantedAt = data.grantedAt as Timestamp | undefined;
      
      return {
        userId: doc.id,
        email: data.email || '',
        displayName: data.displayName,
        grantedAt: grantedAt?.toDate() || new Date(),
        grantedBy: data.grantedBy || '',
      };
    });
  } catch (error) {
    console.error('Error fetching profile managers:', error);
    return [];
  }
}

/**
 * Add a manager to a profile (SERVER ONLY)
 */
export async function addProfileManager(
  userId: string,
  managerEmail: string,
  grantedBy: string
): Promise<void> {
  try {
    // First find the manager's userId by email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', managerEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new Error('Gebruiker niet gevonden');
    }

    const managerDoc = usersSnapshot.docs[0];
    const managerId = managerDoc.id;
    const managerData = managerDoc.data();

    // Add to profileManagers subcollection
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('profileManagers')
      .doc(managerId)
      .set({
        email: managerEmail,
        displayName: managerData.displayName || `${managerData.firstName} ${managerData.lastName}`,
        grantedAt: new Date(),
        grantedBy,
      });
  } catch (error) {
    console.error('Error adding profile manager:', error);
    throw error;
  }
}

/**
 * Remove a manager from a profile (SERVER ONLY)
 */
export async function removeProfileManager(userId: string, managerId: string): Promise<void> {
  try {
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('profileManagers')
      .doc(managerId)
      .delete();
  } catch (error) {
    console.error('Error removing profile manager:', error);
    throw error;
  }
}

// ============================================================================
// USER PROFILES
// ============================================================================

/**
 * Get user profile by userId (SERVER ONLY)
 */
export async function getUserProfile(userId: string): Promise<(UserProfile & { id: string }) | null> {
  try {
    const docSnap = await adminDb.collection('users').doc(userId).get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    if (!data) return null;

    // Convert Firestore Timestamps to Dates
    const createdAt = data.createdAt as Timestamp | undefined;
    const updatedAt = data.updatedAt as Timestamp | undefined;

    return {
      id: docSnap.id,
      userId: docSnap.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: data.displayName || '',
      email: data.email || '',
      username: data.username || null,
      phone: data.phone || null,
      photoURL: data.photoURL || null,
      birthdate: data.birthdate || null,
      gender: data.gender || null,
      address: data.address || {
        street: null,
        number: null,
        box: null,
        postalCode: null,
        city: null,
        country: null,
      },
      isPublic: data.isPublic || false,
      isAdmin: data.isAdmin || false,
      isPartner: data.isPartner || false,
      sharedWith: data.sharedWith || [],
      createdAt: createdAt?.toDate() || new Date(),
      updatedAt: updatedAt?.toDate() || new Date(),
      socials: data.socials || null,
    } as UserProfile & { id: string };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user profile by username (SERVER ONLY)
 */
export async function getUserProfileByUsername(
  username: string
): Promise<(UserProfile & { id: string }) | null> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const createdAt = data.createdAt as Timestamp | undefined;
    const updatedAt = data.updatedAt as Timestamp | undefined;

    return {
      id: doc.id,
      userId: doc.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: data.displayName || '',
      email: data.email || '',
      username: data.username || null,
      phone: data.phone || null,
      photoURL: data.photoURL || null,
      birthdate: data.birthdate || null,
      gender: data.gender || null,
      address: data.address || {
        street: null,
        number: null,
        box: null,
        postalCode: null,
        city: null,
        country: null,
      },
      isPublic: data.isPublic || false,
      isAdmin: data.isAdmin || false,
      isPartner: data.isPartner || false,
      sharedWith: data.sharedWith || [],
      createdAt: createdAt?.toDate() || new Date(),
      updatedAt: updatedAt?.toDate() || new Date(),
      socials: data.socials || null,
    } as UserProfile & { id: string };
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    return null;
  }
}

/**
 * Update user profile (SERVER ONLY)
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        ...data,
        updatedAt: new Date(),
      });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Create user profile (SERVER ONLY)
 */
export async function createUserProfile(
  userId: string,
  data: Omit<UserProfile, 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    await adminDb
      .collection('users')
      .doc(userId)
      .set({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Delete user profile (SERVER ONLY)
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  try {
    await adminDb.collection('users').doc(userId).delete();
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

/**
 * Check if profile is shared with user (SERVER ONLY)
 */
export async function isProfileSharedWithUser(
  profileUserId: string,
  currentUserId: string
): Promise<boolean> {
  try {
    const managerSnap = await adminDb
      .collection('users')
      .doc(profileUserId)
      .collection('profileManagers')
      .doc(currentUserId)
      .get();

    return managerSnap.exists;
  } catch (error) {
    console.error('Error checking profile sharing:', error);
    return false;
  }
}