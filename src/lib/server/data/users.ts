// src/lib/server/data/users.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';
import { cache } from 'react';

export const getUserProfileById = cache(async (userId: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await adminDb.collection('users').doc(userId).get();
    if (!docSnap.exists) {
      console.warn(`[getUserProfileById] Geen profiel gevonden voor ID: ${userId}`);
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  } catch (error) {
    console.error(`[getUserProfileById] Fout bij ophalen van profiel voor ID ${userId}:`, error);
    return null;
  }
});

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
        const snapshot = await adminDb.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserProfile;
    } catch (error) {
        console.error(`[findUserByEmail] Fout bij zoeken naar e-mail ${email}:`, error);
        return null;
    }
}

export async function getProfileManagers(managerIds: string[]): Promise<UserProfile[]> {
  if (!managerIds || managerIds.length === 0) {
    return [];
  }
  try {
    const managerPromises = managerIds.map(id => getUserProfileById(id));
    const managers = await Promise.all(managerPromises);
    return managers.filter((manager): manager is UserProfile => manager !== null);
  } catch (error) {
    console.error('[getProfileManagers] Fout bij ophalen van managers:', error);
    return [];
  }
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('username', '==', username).limit(1).get();
        if (snapshot.empty) return null;
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error) {
        console.error(`Error fetching profile by username: ${username}`, error);
        return null;
    }
}