'use server';

import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile, SubProfile } from '@/types/user';
import { userProfileSchema, subProfileSchema } from '@/types/user';

// ============================================================================
// GET USER PROFILE BY ID
// ============================================================================

/**
 * ✅ FIXED: Haal een user profile op via user ID
 * Cached met unstable_cache
 */
export async function getUserProfileById(userId: string): Promise<(UserProfile & { id: string }) | null> {
  return unstable_cache(
    async () => {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
          return null;
        }

        const userData = userDoc.data();

        // Valideer tegen schema
        const validation = userProfileSchema.safeParse({
          ...userData,
          id: userId,
        });

        if (!validation.success) {
          console.error('User profile validation failed:', validation.error.flatten());
          return null;
        }

        return validation.data as UserProfile & { id: string };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    [`user-profile-${userId}`], // ✅ Cache key
    {
      tags: ['users', `user-${userId}`], // ✅ DIRECT ARRAY (geen functie!)
      revalidate: 3600, // 1 uur
    }
  )();
}

// ============================================================================
// GET USER PROFILE BY USERNAME
// ============================================================================

export async function getUserProfileByUsername(username: string): Promise<(UserProfile & { id: string }) | null> {
  return unstable_cache(
    async () => {
      try {
        const usersSnapshot = await adminDb
          .collection('users')
          .where('displayName', '==', username)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          return null;
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        const validation = userProfileSchema.safeParse({
          ...userData,
          id: userDoc.id,
        });

        if (!validation.success) {
          console.error('User profile validation failed:', validation.error.flatten());
          return null;
        }

        return validation.data as UserProfile & { id: string };
      } catch (error) {
        console.error('Error fetching user by username:', error);
        return null;
      }
    },
    [`user-username-${username}`],
    {
      tags: ['users', `username-${username}`],
      revalidate: 3600,
    }
  )();
}

// ============================================================================
// GET MANAGED PROFILES
// ============================================================================

/**
 * ✅ FIXED: Haal alle sub-profielen op die beheerd worden door een manager
 */
export async function getManagedProfiles(managerId: string): Promise<(SubProfile & { id: string })[]> {
  return unstable_cache(
    async () => {
      try {
        const profilesSnapshot = await adminDb
          .collection('profiles')
          .where('userId', '==', managerId)
          .get();

        if (profilesSnapshot.empty) {
          return [];
        }

        return profilesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const validation = subProfileSchema.safeParse({
              ...data,
              id: doc.id,
            });

            if (!validation.success) {
              console.error('Sub-profile validation failed:', validation.error.flatten());
              return null;
            }

            return validation.data as SubProfile & { id: string };
          })
          .filter((profile): profile is SubProfile & { id: string } => profile !== null);
      } catch (error) {
        console.error('Error fetching managed profiles:', error);
        return [];
      }
    },
    [`managed-profiles-${managerId}`],
    {
      tags: ['users', 'profiles', `user-${managerId}-profiles`], // ✅ DIRECT ARRAY
      revalidate: 3600,
    }
  )();
}

// ============================================================================
// GET PROFILE MANAGERS
// ============================================================================

/**
 * Haal de managers op van een lijst van manager IDs
 */
export async function getProfileManagers(managerIds: string[]): Promise<(UserProfile & { id: string })[]> {
  if (!managerIds || managerIds.length === 0) return [];

  try {
    const managers = await Promise.all(
      managerIds.map((id) => getUserProfileById(id))
    );

    return managers.filter((manager): manager is UserProfile & { id: string } => manager !== null);
  } catch (error) {
    console.error('Error fetching profile managers:', error);
    return [];
  }
}

// ============================================================================
// GET FOLLOW DATA
// ============================================================================

/**
 * ✅ FIXED: Haal follow data op (followers/following counts)
 */
export async function getFollowData(userId: string): Promise<{
  followersCount: number;
  followingCount: number;
}> {
  return unstable_cache(
    async () => {
      try {
        const [followersSnapshot, followingSnapshot] = await Promise.all([
          adminDb.collection('follows').where('followingId', '==', userId).get(),
          adminDb.collection('follows').where('followerId', '==', userId).get(),
        ]);

        return {
          followersCount: followersSnapshot.size,
          followingCount: followingSnapshot.size,
        };
      } catch (error) {
        console.error('Error fetching follow data:', error);
        return {
          followersCount: 0,
          followingCount: 0,
        };
      }
    },
    [`follow-data-${userId}`],
    {
      tags: ['users', `user-${userId}-follows`], // ✅ DIRECT ARRAY
      revalidate: 300, // 5 minuten
    }
  )();
}

// ============================================================================
// REVALIDATE HELPERS
// ============================================================================

export async function revalidateUserProfile(userId: string) {
  revalidateTag(`user-${userId}`);
  revalidateTag('users');
}

export async function revalidateUserFollows(userId: string) {
  revalidateTag(`user-${userId}-follows`);
}