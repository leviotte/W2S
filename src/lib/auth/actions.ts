'use server';

import 'server-only';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { getSession, createSession as setSession, destroySession } from './session';
import { adminDb, adminAuth } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';
import { z } from 'zod';

// ============================================================================
// EXPORTS - Alles wat andere files nodig hebben
// ============================================================================

export { getSession, destroySession } from './session';

// ============================================================================
// TYPES
// ============================================================================

export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const registerSchema = z.object({
  email: z.string().email('Ongeldig emailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
  firstName: z.string().min(1, 'Voornaam is verplicht'),
  lastName: z.string().min(1, 'Achternaam is verplicht'),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Ongeldig emailadres'),
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

// ============================================================================
// HELPER: Get Current User
// ============================================================================

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getSession();
  
  if (!session.user) {
    return null;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(session.user.id).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    
    return {
      ...userData,
      id: session.user.id,
      createdAt: userData?.createdAt?.toDate?.() || new Date(),
      updatedAt: userData?.updatedAt?.toDate?.() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// ============================================================================
// HELPER: Require Auth
// ============================================================================

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }
  
  return user;
}

// ============================================================================
// HELPER: Require Admin
// ============================================================================

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    redirect('/dashboard');
  }
  
  return user;
}

// ============================================================================
// HELPER: Get Managed Profiles
// ============================================================================

export async function getManagedProfiles(userId: string) {
  try {
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('userId', '==', userId)
      .get();
    
    return profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Get managed profiles error:', error);
    return [];
  }
}

// ============================================================================
// CREATE SESSION (exported for client-side auth completion)
// ============================================================================

export { setSession as createSession };

// ============================================================================
// COMPLETE REGISTRATION
// ============================================================================

export async function completeRegistrationAction(data: {
  idToken: string;
  firstName: string;
  lastName: string;
  birthdate?: string;
  gender?: string;
  city?: string;
  country?: string;
}): Promise<ActionResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(data.idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return { success: false, error: 'Email niet gevonden in token' };
    }

    const adminEmails = ['leviotte@icloud.com', 'deneyer.liesa@telenet.be'];
    const isAdmin = adminEmails.includes(email);

    const displayName = `${data.firstName} ${data.lastName}`;
    const slug = displayName.toLowerCase().replace(/\s+/g, '-');
    
    const userProfile = {
      id: uid,
      userId: uid,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName,
      email,
      photoURL: null,
      birthdate: data.birthdate || '',
      gender: data.gender || '',
      address: data.city && data.country ? {
        city: data.city,
        country: data.country,
      } : null,
      slug,
      isPublic: true,
      isAdmin,
      isPartner: false,
      emailVerified: false,
      notifications: { email: true },
      firstName_lower: data.firstName.toLowerCase(),
      lastName_lower: data.lastName.toLowerCase(),
    };

    await adminDb.collection('users').doc(uid).set({
      ...userProfile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await setSession({
      id: uid,
      email,
      displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      photoURL: null,
      isAdmin,
      isPartner: false,
    });

    revalidatePath('/', 'layout');

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error('Complete registration error:', error);
    return { 
      success: false, 
      error: 'Fout bij het aanmaken van gebruikersprofiel' 
    };
  }
}

// ============================================================================
// COMPLETE LOGIN
// ============================================================================

export async function completeLoginAction(
  idToken: string
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return { 
        success: false, 
        error: 'Gebruiker niet gevonden' 
      };
    }

    const userData = userDoc.data();
    if (!userData) {
      return { success: false, error: 'Gebruikersdata niet gevonden' };
    }

    await setSession({
      id: uid,
      email: userData.email,
      displayName: userData.displayName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      photoURL: userData.photoURL || null,
      username: userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '-'),
      isAdmin: userData.isAdmin || false,
      isPartner: userData.isPartner || false,
    });

    revalidatePath('/', 'layout');

    const redirectTo = userData.isAdmin ? '/admin-dashboard' : '/dashboard';

    return { 
      success: true, 
      data: { redirectTo } 
    };

  } catch (error: any) {
    console.error('Complete login error:', error);
    return {
      success: false,
      error: 'Login mislukt',
    };
  }
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

export async function logoutAction(): Promise<ActionResult> {
  try {
    await destroySession();
    revalidatePath('/', 'layout');
    
    return { success: true, data: undefined };
  } catch (error: any) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'Uitloggen mislukt',
    };
  }
}

// ============================================================================
// GOOGLE SIGN-IN
// ============================================================================

export async function completeGoogleSignInAction(
  idToken: string
): Promise<ActionResult<{ redirectTo: string; isNewUser: boolean }>> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email!;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const isNewUser = !userDoc.exists;

    if (isNewUser) {
      const displayName = decodedToken.name || email.split('@')[0];
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const adminEmails = ['leviotte@icloud.com', 'deneyer.liesa@telenet.be'];
      const isAdmin = adminEmails.includes(email);

      const userProfile = {
        id: uid,
        userId: uid,
        firstName,
        lastName,
        displayName,
        email,
        photoURL: decodedToken.picture || null,
        slug: displayName.toLowerCase().replace(/\s+/g, '-'),
        isPublic: true,
        isAdmin,
        isPartner: false,
        emailVerified: true,
        notifications: { email: true },
        firstName_lower: firstName.toLowerCase(),
        lastName_lower: lastName.toLowerCase(),
      };

      await adminDb.collection('users').doc(uid).set({
        ...userProfile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      const userData = userDoc.data();
      if (userData && !userData.photoURL && decodedToken.picture) {
        await adminDb.collection('users').doc(uid).update({
          photoURL: decodedToken.picture,
          updatedAt: Timestamp.now(),
        });
      }
    }

    const updatedUserDoc = await adminDb.collection('users').doc(uid).get();
    const userData = updatedUserDoc.data();

    if (!userData) {
      return { success: false, error: 'Gebruikersdata niet gevonden' };
    }

    await setSession({
      id: uid,
      email: userData.email,
      displayName: userData.displayName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      photoURL: userData.photoURL || null,
      username: userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '-'),
      isAdmin: userData.isAdmin || false,
      isPartner: userData.isPartner || false,
    });

    revalidatePath('/', 'layout');

    const redirectTo = userData.isAdmin ? '/admin-dashboard' : '/dashboard';

    return { 
      success: true, 
      data: { redirectTo, isNewUser } 
    };

  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: 'Google inloggen mislukt',
    };
  }
}