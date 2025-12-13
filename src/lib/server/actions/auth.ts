'use server';

import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { createSession, destroySession } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  birthdate?: string; // ISO date string
  gender?: string;
  country?: string;
  location?: string;
  email: string;
  password: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: {
    userId?: string;
    redirectTo?: string;
  };
}

// ============================================================================
// COMPLETE REGISTRATION ACTION
// ============================================================================

export async function completeRegistrationAction(data: {
  idToken: string;
  firstName: string;
  lastName: string;
  birthdate?: string;
  gender?: string;
  country?: string;
  location?: string;
}): Promise<AuthActionResult> {
  try {
    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(data.idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email!;

    // Get Firebase user to check email verification status
    const firebaseUser = await adminAuth.getUser(uid);

    // Create full user profile in Firestore
    const userProfile = {
      firstName: data.firstName,
      lastName: data.lastName,
      firstName_lower: data.firstName.toLowerCase(),
      lastName_lower: data.lastName.toLowerCase(),
      email,
      displayName: `${data.firstName} ${data.lastName}`,
      photoURL: null,
      username: null,
      birthdate: data.birthdate || null,
      gender: data.gender || null,
      country: data.country || null,
      location: data.location || null,
      isAdmin: false,
      isPartner: false,
      emailVerified: firebaseUser.emailVerified,
      notifications: {
        email: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(uid).set(userProfile);

    // Create session ONLY if email is verified
    // (We'll check this client-side too, but double-check here)
    if (firebaseUser.emailVerified) {
      const sessionUser: Omit<SessionUser, 'isLoggedIn' | 'createdAt' | 'lastActivity'> = {
        id: uid,
        email,
        displayName: userProfile.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        photoURL: null,
        username: null,
        isAdmin: false,
        isPartner: false,
      };

      await createSession(sessionUser);
      revalidatePath('/dashboard');
    }

    console.log(`[Auth] ✅ User registered: ${email}`);
    return { 
      success: true, 
      data: { 
        userId: uid,
        redirectTo: firebaseUser.emailVerified ? '/dashboard' : '/',
      } 
    };
  } catch (error: any) {
    console.error('[Auth] Registration completion error:', error);
    return { success: false, error: error.message || 'Registratie mislukt' };
  }
}

// ============================================================================
// COMPLETE LOGIN ACTION
// ============================================================================

export async function completeLoginAction(idToken: string): Promise<AuthActionResult> {
  try {
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { success: false, error: 'Gebruiker niet gevonden' };
    }

    const userData = userDoc.data()!;

    // Check email verification
    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.emailVerified) {
      return { 
        success: false, 
        error: 'E-mail niet geverifieerd. Controleer je inbox.' 
      };
    }

    // Update email verification status in Firestore if needed
    if (!userData.emailVerified) {
      await adminDb.collection('users').doc(uid).update({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    }

    // Create session
    const sessionUser: Omit<SessionUser, 'isLoggedIn' | 'createdAt' | 'lastActivity'> = {
      id: uid,
      email: userData.email,
      displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      photoURL: userData.photoURL || null,
      username: userData.username || null,
      isAdmin: userData.isAdmin === true,
      isPartner: userData.isPartner === true,
    };

    await createSession(sessionUser);

    // Revalidate dashboard
    revalidatePath('/dashboard');

    // Determine redirect based on role
    const redirectTo = userData.isAdmin ? '/admin-dashboard' : '/dashboard';

    console.log(`[Auth] ✅ User logged in: ${userData.email}`);
    return { 
      success: true, 
      data: { 
        userId: uid,
        redirectTo,
      } 
    };
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return { success: false, error: error.message || 'Login mislukt' };
  }
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await destroySession();
    revalidatePath('/');
    console.log('[Auth] ✅ User logged out');
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message || 'Logout mislukt' };
  }
}