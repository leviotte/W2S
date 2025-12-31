// src/lib/server/actions/auth.ts
'use server';

import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { createSession, destroySession } from '@/lib/auth/session.server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/* ============================================================================
 * TYPES
 * ========================================================================== */
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

/* ============================================================================
 * HELPERS
 * ========================================================================== */
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
  let cleanPhotoURL = data.photoURL ?? null;
  if (cleanPhotoURL && cleanPhotoURL.startsWith('data:')) cleanPhotoURL = null;
  if (cleanPhotoURL && cleanPhotoURL.length > 500) cleanPhotoURL = null;

  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName,
    photoURL: cleanPhotoURL,
    username: data.username ?? null,
    isAdmin: data.isAdmin || false,
    isPartner: data.isPartner || false,
  };
}

/* ============================================================================
 * PASSWORD RESET
 * ========================================================================== */
const passwordResetSchema = z.object({ email: z.string().email() });

export async function sendPasswordResetEmail(email: string): Promise<void> {
  // Verifieer dat de gebruiker bestaat
  const user = await adminAuth.getUserByEmail(email).catch(() => null);
  if (!user) throw new Error('Geen gebruiker gevonden met dit e-mailadres.');

  // Genereer een password reset link via Firebase
  const resetLink = await adminAuth.generatePasswordResetLink(email);

  // TODO: Verstuur e-mail via je eigen e-mail provider
  // Voor een state-of-the-art SaaS: via SendGrid/SES/SMTP
  console.log(`[Auth] 🔑 Password reset link voor ${email}: ${resetLink}`);
}

/* ============================================================================
 * REGISTRATION / LOGIN / SOCIAL LOGIN / LOGOUT
 * ========================================================================== */
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
      notifications: { email: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(uid).set(userProfile);
    console.log(`[Auth] ✅ User registered (pending email verification): ${email}`);
    return { success: true, data: { userId: uid, redirectTo: '/' } };
  } catch (error: any) {
    console.error('[Auth] Registration completion error:', error);
    return { success: false, error: error.message || 'Registratie mislukt' };
  }
}

export async function completeLoginAction(idToken: string): Promise<AuthActionResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return { success: false, error: 'Gebruiker niet gevonden.' };

    const userData = userDoc.data()!;
    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.emailVerified) return { success: false, error: 'E-mail niet geverifieerd.' };

    if (!userData.emailVerified) {
      await adminDb.collection('users').doc(uid).update({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
    }

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

    const sessionSize = JSON.stringify(sessionData).length;
    if (sessionSize > 1000) throw new Error(`Session data too large: ${sessionSize} bytes`);

    await createSession(sessionData);
    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';
    return { success: true, data: { userId: uid, redirectTo } };
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return { success: false, error: error.message || 'Login mislukt' };
  }
}

export async function completeSocialLoginAction(
  idToken: string,
  provider: 'google' | 'apple'
): Promise<AuthActionResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    if (!email) return { success: false, error: 'Geen email gevonden in social account' };

    let userDoc = await adminDb.collection('users').doc(uid).get();
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
      userDoc = await adminDb.collection('users').doc(uid).get();
    }

    const userData = userDoc.data()!;
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

    await createSession(sessionData);
    revalidatePath('/dashboard');

    const redirectTo = userData.isAdmin ? '/admin' : '/dashboard';
    return { success: true, data: { userId: uid, redirectTo } };
  } catch (error: any) {
    console.error('[Auth] Social login error:', error);
    return { success: false, error: error.message || 'Social login mislukt' };
  }
}

export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await destroySession();
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message || 'Logout mislukt' };
  }
}
