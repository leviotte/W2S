'use server';

import 'server-only';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';

export async function getSession() {
  const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session.user?.isLoggedIn) {
    return null;
  }

  try {
    const userRef = adminDb.collection('users').doc(session.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await session.destroy();
      return null;
    }
    
    return {
      id: session.user.id,
      ...userDoc.data(),
    } as UserProfile & { id: string };

  } catch (error) {
    console.error("Failed to fetch authenticated user profile:", error);
    await session.destroy();
    return null;
  }
}

export async function getManagedProfiles(managerId: string): Promise<(UserProfile & { id: string })[]> {
    if (!managerId) return [];
    try {
        const profilesSnapshot = await adminDb
            .collection('users')
            .where('managedBy', '==', managerId)
            .get();
        if (profilesSnapshot.empty) return [];
        return profilesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as (UserProfile & { id: string })[];
    } catch (error) {
        console.error("Failed to fetch managed profiles:", error);
        return [];
    }
}

export async function createSession(uid: string) {
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`User profile not found in Firestore for UID: ${uid}`);
  }

  const userProfile = userDoc.data() as UserProfile;

  // --- DE FIX ---
  // We destructuren de 'id' uit userProfile en negeren die,
  // omdat we de authoratieve 'uid' al hebben.
  const { id: _, ...restOfProfile } = userProfile;

  const session = await getSession();
  
  session.user = {
    id: uid, // De enige, correcte ID.
    isLoggedIn: true,
    ...restOfProfile, // De rest van de profielinformatie.
  };
  await session.save();

  revalidatePath('/', 'layout');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  revalidatePath('/', 'layout');
  redirect('/');
}