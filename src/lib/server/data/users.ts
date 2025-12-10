// src/lib/server/data/users.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { UserProfileSchema, type UserProfile } from '@/types/user';
import { unstable_cache as cache } from 'next/cache';
import type admin from 'firebase-admin';

// Private helper om Firestore docs consistent te verwerken en te valideren
const processAndValidateDoc = (doc: admin.firestore.DocumentSnapshot, context: string): UserProfile | null => {
    if (!doc.exists) return null;
    const data = doc.data();
    
    // Converteer Firestore Timestamps naar JS Dates voor Zod validatie
    const processedData = {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
    };

    const parsed = UserProfileSchema.safeParse(processedData);
    if (!parsed.success) {
        console.error(`[${context}] Validation failed for doc ${doc.id}:`, parsed.error.flatten());
        return null;
    }
    return parsed.data;
}

/**
 * Haalt een user profiel op uit Firestore op basis van ID. Gecached.
 */
export const getUserProfileById = cache(
    async (uid: string): Promise<UserProfile | null> => {
        if (!uid) return null;
        try {
            const userDoc = await adminDb.collection('users').doc(uid).get();
            return processAndValidateDoc(userDoc, 'getUserProfileById');
        } catch (error) {
            console.error(`Error fetching user profile for ${uid}:`, error);
            return null;
        }
    },
    ['user-profile-by-id'],
    { tags: ['users'], revalidate: 3600 }
);

/**
 * Haalt de beheerde sub-profielen op voor een gegeven ownerId. Gecached.
 */
export const getManagedProfiles = cache(
  async (ownerId: string): Promise<UserProfile[]> => {
    if (!ownerId) return [];
    try {
      const snapshot = await adminDb.collection('users').where('ownerId', '==', ownerId).get();
      if (snapshot.empty) return [];
      
      return snapshot.docs
        .map(doc => processAndValidateDoc(doc, 'getManagedProfiles'))
        .filter((p): p is UserProfile => p !== null);
    } catch (error) {
      console.error("Error fetching managed profiles:", error);
      return [];
    }
  },
  ['managed-profiles'],
  { tags: ['users', 'profiles'], revalidate: 300 }
);

/**
 * Zoekt een gebruiker op basis van e-mailadres. Gecached.
 */
export const findUserByEmail = cache(
    async (email: string): Promise<UserProfile | null> => {
        if (!email) return null;
        try {
            const snapshot = await adminDb.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
            if (snapshot.empty) return null;
            return processAndValidateDoc(snapshot.docs[0], 'findUserByEmail');
        } catch (error) {
            console.error(`Error finding user by email ${email}:`, error);
            return null;
        }
    },
    ['user-by-email'],
    { tags: ['users'], revalidate: 3600 }
);

/**
 * Haalt een profiel op basis van de unieke username. Gecached.
 */
export const getProfileByUsername = cache(
    async (username: string): Promise<UserProfile | null> => {
        if (!username) return null;
        try {
            const snapshot = await adminDb.collection('users').where('username', '==', username).limit(1).get();
            if (snapshot.empty) return null;
            return processAndValidateDoc(snapshot.docs[0], 'getProfileByUsername');
        } catch (error) {
            console.error(`Error fetching profile by username: ${username}`, error);
            return null;
        }
    },
    ['user-by-username'],
    { tags: ['users'], revalidate: 3600 }
);

/**
 * Haalt de profielen van meerdere managers op. Niet individueel gecached, maar gebruikt de gecachte `getUserProfileById`.
 */
export async function getProfileManagers(managerIds: string[]): Promise<UserProfile[]> {
  if (!managerIds || managerIds.length === 0) return [];
  try {
    const managerPromises = managerIds.map(id => getUserProfileById(id));
    const managers = await Promise.all(managerPromises);
    return managers.filter((manager): manager is UserProfile => manager !== null);
  } catch (error) {
    console.error('Error fetching profile managers:', error);
    return [];
  }
}