'use server';

import 'server-only';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile, SessionUser, AuthedUser } from '@/types/user';
import { userProfileSchema } from '@/types/user';

/**
 * Verkrijg de huidige iron-session
 */
export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

/**
 * Verkrijg de huidige ingelogde gebruiker met volledige profile
 * Returns null als niet ingelogd
 * 
 * BEST PRACTICE: Gebruikt voor server components en server actions
 */
export async function getCurrentUser(): Promise<(UserProfile & { id: string }) | null> {
  const session = await getSession();

  if (!session.user?.isLoggedIn) {
    return null;
  }

  try {
    const userRef = adminDb.collection('users').doc(session.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Session is invalid, destroy it
      await session.destroy();
      return null;
    }

    const userData = userDoc.data();
    
    // Valideer data tegen schema
    const validation = userProfileSchema.safeParse({
      ...userData,
      id: session.user.id,
    });

    if (!validation.success) {
      console.error('User profile validation failed:', validation.error.flatten());
      return null;
    }
    
    return validation.data as UserProfile & { id: string };

  } catch (error) {
    console.error("Failed to fetch authenticated user profile:", error);
    await session.destroy();
    return null;
  }
}

/**
 * Verkrijg de huidige gebruiker als AuthedUser type
 * Gebruikt voor pages die een AuthedUser verwachten
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await getSession();

  if (!session.user?.isLoggedIn) {
    return null;
  }

  const profile = await getCurrentUser();
  
  if (!profile) {
    return null;
  }

  return {
    isLoggedIn: true,
    id: profile.id,
    email: profile.email,
    profile,
  };
}

/**
 * Haal alle profielen op die beheerd worden door de manager
 */
export async function getManagedProfiles(managerId: string): Promise<(UserProfile & { id: string })[]> {
  if (!managerId) return [];
  
  try {
    const profilesSnapshot = await adminDb
      .collection('profiles') // ✅ Sub-profiles zitten in 'profiles' collection
      .where('userId', '==', managerId)
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

/**
 * Creëer een nieuwe session na Firebase login
 * WORDT AANGEROEPEN: Na succesvolle Firebase authenticatie
 */
export async function createSession(uid: string) {
  const userRef = adminDb.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`User profile not found in Firestore for UID: ${uid}`);
  }

  const userProfile = userDoc.data() as UserProfile;

  const session = await getSession();
  
  // Sla alleen essentiële data op in session (minimale payload)
  session.user = {
    id: uid,
    isLoggedIn: true,
    email: userProfile.email,
    displayName: userProfile.displayName,
    photoURL: userProfile.photoURL || null,
    isAdmin: userProfile.isAdmin || false,
    isPartner: userProfile.isPartner || false,
  } satisfies SessionUser;

  await session.save();

  // Revalideer alle layouts (voor Navbar, TeamSwitcher, etc.)
  revalidatePath('/', 'layout');
}

/**
 * Log de gebruiker uit en destroy session
 */
export async function logout() {
  const session = await getSession();
  session.destroy();
  
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Check of de huidige gebruiker een admin is
 * Convenience function voor authorization checks
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.user?.isAdmin === true;
}

/**
 * Check of de huidige gebruiker een partner is
 */
export async function isPartner(): Promise<boolean> {
  const session = await getSession();
  return session.user?.isPartner === true;
}

/**
 * Require authentication - throw redirect als niet ingelogd
 * Gebruikt in pages die altijd auth vereisen
 */
export async function requireAuth(): Promise<UserProfile & { id: string }> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

/**
 * Require admin - throw redirect als niet admin
 */
export async function requireAdmin(): Promise<UserProfile & { id: string }> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    redirect('/dashboard'); // Of een 403 page
  }
  
  return user;
}