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
 * 
 * ❌ NEVER use spread operator (...userData)
 * ✅ ALWAYS explicitly pick only needed fields
 * ⚠️ FILTER OUT base64 images - they're HUGE!
 */
function extractSessionData(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string | null;
  username?: string | null;
  isAdmin?: boolean;
  isPartner?: boolean;
}) {
  let cleanPhotoURL = data.photoURL ?? null; // ← nooit undefined
  if (cleanPhotoURL && cleanPhotoURL.startsWith('data:')) {
    console.warn('[Auth] ⚠️ Base64 image detected in photoURL - removing from session');
    cleanPhotoURL = null;
  }

  if (cleanPhotoURL && cleanPhotoURL.length > 500) {
    console.warn('[Auth] ⚠️ PhotoURL too long:', cleanPhotoURL.length, 'chars - removing');
    cleanPhotoURL = null;
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName,
    photoURL: cleanPhotoURL, // ✅ altijd string | null
    username: data.username ?? null, // ✅ altijd string | null
    isAdmin: data.isAdmin || false,
    isPartner: data.isPartner || false,
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

    // ✅ FIX: EXPLICIT field extraction, NO spread operator!
    const sessionData = extractSessionData({
      id: uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      username: userData.username,
      isAdmin: userData.isAdmin,
      isPartner: userData.isPartner,
    });

    // ✅ Log session size BEFORE calling createSession
    const sessionSize = JSON.stringify(sessionData).length;
    console.log('[Auth] 📊 Session data size:', sessionSize, 'bytes');
    
    if (sessionSize > 1000) {
      console.error('[Auth] ❌ Session data too large!');
      console.error('[Auth] Session data:', JSON.stringify(sessionData, null, 2));
      throw new Error(`Session data too large: ${sessionSize} bytes`);
    }

    await createSession(sessionData);

    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';

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

    // Create profile if doesn't exist
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

    // ✅ FIX: EXPLICIT field extraction, NO spread operator!
    const sessionData = extractSessionData({
      id: uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      username: userData.username,
      isAdmin: userData.isAdmin,
      isPartner: userData.isPartner,
    });

    // ✅ Log session size BEFORE calling createSession
    const sessionSize = JSON.stringify(sessionData).length;
    console.log('[Auth] 📊 Session data size:', sessionSize, 'bytes');
    
    if (sessionSize > 1000) {
      console.error('[Auth] ❌ Session data too large!');
      console.error('[Auth] Session data:', JSON.stringify(sessionData, null, 2));
      throw new Error(`Session data too large: ${sessionSize} bytes`);
    }

    await createSession(sessionData);

    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';

    console.log(`[Auth] ✅ Social login (${provider}): ${email}`);
    
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