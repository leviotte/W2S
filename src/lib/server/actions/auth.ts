// src/lib/server/actions/auth.ts
'use server';

import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { createSession, destroySession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  birthdate?: string;
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
// HELPER: EXTRACT MINIMAL SESSION DATA
// ============================================================================

/**
 * ⚠️ CRITICAL: Extract ONLY the minimal fields needed for session
 * This prevents the cookie from exceeding 4KB limit
 */
function extractSessionData(userData: any) {
  return {
    id: userData.id || '',
    email: userData.email || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || '',
    photoURL: userData.photoURL || null,
    username: userData.username || null,
    isAdmin: userData.isAdmin === true,
    isPartner: userData.isPartner === true,
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
    const decodedToken = await adminAuth.verifyIdToken(data.idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email!;

    const firebaseUser = await adminAuth.getUser(uid);

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
      isAdmin: email === 'leviotte@icloud.com',
      isPartner: false,
      emailVerified: firebaseUser.emailVerified,
      notifications: {
        email: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(uid).set(userProfile);

    console.log(`[Auth] ✅ User registered (pending email verification): ${email}`);
    
    return {
      success: true,
      data: {
        userId: uid,
        redirectTo: '/',
      },
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { success: false, error: 'Gebruiker niet gevonden in database. Registreer opnieuw.' };
    }

    const userData = userDoc.data()!;

    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.emailVerified) {
      return { 
        success: false, 
        error: 'E-mail niet geverifieerd. Controleer je inbox.' 
      };
    }

    if (!userData.emailVerified) {
      await adminDb.collection('users').doc(uid).update({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    }

    // ✅ FIX: Extract ONLY minimal session data
    const sessionData = extractSessionData({
      id: uid,
      ...userData,
    });

    await createSession(sessionData);

    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';

    console.log(`[Auth] ✅ User logged in: ${userData.email}`);
    console.log(`[Auth] 📊 Session data size: ${JSON.stringify(sessionData).length} bytes`);
    
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
// COMPLETE SOCIAL LOGIN ACTION
// ============================================================================

export async function completeSocialLoginAction(
  idToken: string,
  provider: 'google' | 'apple'
): Promise<AuthActionResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return { success: false, error: 'Geen email gevonden in social account' };
    }

    let userDoc = await adminDb.collection('users').doc(uid).get();

    // ✅ FIX: If user doesn't exist in Firestore, create profile
    if (!userDoc.exists) {
      const firebaseUser = await adminAuth.getUser(uid);
      const displayName = firebaseUser.displayName || email.split('@')[0];
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const newProfile = {
        firstName,
        lastName,
        firstName_lower: firstName.toLowerCase(),
        lastName_lower: lastName.toLowerCase(),
        email,
        displayName,
        photoURL: firebaseUser.photoURL || null,
        username: null,
        birthdate: null,
        gender: null,
        country: null,
        location: null,
        isAdmin: email === 'leviotte@icloud.com',
        isPartner: false,
        emailVerified: true,
        notifications: { email: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: provider,
      };

      await adminDb.collection('users').doc(uid).set(newProfile);
      console.log(`[Auth] ✅ Created new Firestore profile for social login: ${email}`);
      
      userDoc = await adminDb.collection('users').doc(uid).get();
    }

    const userData = userDoc.data()!;

    // ✅ FIX: Extract ONLY minimal session data
    const sessionData = extractSessionData({
      id: uid,
      ...userData,
    });

    await createSession(sessionData);

    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';

    console.log(`[Auth] ✅ Social login (${provider}): ${email}`);
    console.log(`[Auth] 📊 Session data size: ${JSON.stringify(sessionData).length} bytes`);
    
    return { success: true, data: { userId: uid, redirectTo } };
  } catch (error: any) {
    console.error('[Auth] Social login error:', error);
    return { success: false, error: error.message || 'Social login mislukt' };
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