// src/lib/auth/actions.ts
'use server';

import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, type SessionData } from '@/lib/server/session';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';
import { unstable_cache as cache } from 'next/cache';

/**
 * Haalt de huidige server-side sessie op.
 */
export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

/**
 * Haalt het VOLLEDIGE UserProfile object op van de ingelogde gebruiker.
 * Gebruikt caching voor betere prestaties. Dit is de GO-TO functie voor Server Components.
 */
export const getAuthenticatedUserProfile = cache(
  async (): Promise<UserProfile | null> => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
      return null;
    }
    try {
      const userDoc = await adminDb.collection('users').doc(session.uid).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data() as Omit<UserProfile, 'id'>;
      return {
        ...userData,
        id: userDoc.id,
      };
    } catch (error) {
      console.error("Error fetching authenticated user profile:", error);
      return null;
    }
  },
  ['authenticated-user-profile'],
  { tags: ['auth', 'user-profile'], revalidate: 60 }
);


/**
 * Haalt de beheerde sub-profielen op voor een gegeven ownerId.
 * Gebruikt caching voor betere prestaties.
 */
export const getManagedProfiles = cache(
  async (ownerId: string): Promise<UserProfile[]> => {
    if (!ownerId) return [];
    try {
      const profilesSnapshot = await adminDb.collection('users').where('ownerId', '==', ownerId).get();
      if (profilesSnapshot.empty) return [];
      
      return profilesSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<UserProfile, 'id'>;
        return { ...data, id: doc.id };
      });
    } catch (error) {
      console.error("Error fetching managed profiles:", error);
      return [];
    }
  },
  ['managed-profiles-for-user'],
  { tags: ['profiles'], revalidate: 300 }
);


/**
 * Creëert de server-side sessie na een succesvolle login op de client.
 */
export async function createSession(uid: string) {
  const session = await getSession();
  session.uid = uid;
  session.isLoggedIn = true;
  await session.save();
}

/**
 * Vernietigt de huidige sessie (logout).
 * Moet worden aangeroepen vanuit een form action.
 */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
  redirect('/'); 
}