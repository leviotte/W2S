// src/lib/server/actions/auth.ts
'use server';

import { adminAuth, adminDb } from '@/lib/server/firebase-admin';
import { createSession, destroySession } from '@/lib/auth/session.server';
import { z } from 'zod';
import { redirect } from 'next/navigation';

/* ============================================================================
 * TYPES
 * ========================================================================== */
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
function extractSessionData(userData: any) {
  let photoURL = userData.photoURL ?? null;
  if (photoURL && photoURL.startsWith('data:')) photoURL = null;
  if (photoURL && photoURL.length > 500) photoURL = null;

  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    displayName: userData.displayName,
    photoURL,
    username: userData.username ?? null,
    isAdmin: userData.isAdmin || false,
    isPartner: userData.isPartner || false,
  };
}

/* ============================================================================
 * REGISTRATION
 * ========================================================================== */
const registerSchema = z.object({
  idToken: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  location: z.string().optional(),
});

export async function completeRegistrationAction(data: z.infer<typeof registerSchema>): Promise<AuthActionResult> {
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
    await createSession(extractSessionData({ id: uid, ...userProfile }));

    return { success: true, data: { userId: uid, redirectTo: '/' } };
  } catch (err: any) {
    console.error('[Auth] Registration error:', err);
    return { success: false, error: err.message || 'Registratie mislukt' };
  }
}

/* ============================================================================
 * EMAIL + PASSWORD LOGIN
 * ========================================================================== */
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(data: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.parse(data);

  try {
    // 🔹 Firebase REST API call voor e-mail login
    const resp = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: parsed.email,
      password: parsed.password,
      returnSecureToken: true,
    }),
  }
);

    const result = await resp.json();
    if (result.error) throw new Error(result.error.message || 'Login mislukt');

    const idToken = result.idToken;
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData) throw new Error('Gebruiker bestaat nog niet in DB');

    await createSession(extractSessionData({ id: uid, ...userData }));

    // Server-side redirect
    redirect(userData.isAdmin ? '/admin' : '/dashboard');
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return { success: false, error: err.message || 'Login mislukt' };
  }
}

/* ============================================================================
 * SOCIAL LOGIN (GOOGLE / APPLE)
 * ========================================================================== */
const socialLoginSchema = z.object({
  idToken: z.string().min(1),
  provider: z.enum(['google', 'apple']),
});

export async function socialLoginAction(data: z.infer<typeof socialLoginSchema>): Promise<AuthActionResult> {
  try {
    const { idToken, provider } = data;
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    if (!email) throw new Error('Geen e-mail in account');

    let userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      const firebaseUser = await adminAuth.getUser(uid);
      const displayName = firebaseUser.displayName || email.split('@')[0];
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      await adminDb.collection('users').doc(uid).set({
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
      });

      userDoc = await adminDb.collection('users').doc(uid).get();
    }

    const userData = userDoc.data()!;
    await createSession(extractSessionData({ id: uid, ...userData }));

    // Server redirect
    redirect(userData.isAdmin ? '/admin' : '/dashboard');
  } catch (err: any) {
    console.error('[Auth] Social login error:', err);
    return { success: false, error: err.message || 'Social login mislukt' };
  }
}

/* ============================================================================
 * LOGOUT
 * ========================================================================== */
export async function logoutAction(): Promise<AuthActionResult> {
  try {
    await destroySession();
    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Logout error:', err);
    return { success: false, error: err.message || 'Logout mislukt' };
  }
}
/* ============================================================================
 * PASSWORD RESET
 * ========================================================================== */
const passwordResetSchema = z.object({ email: z.string().email() });

export async function sendPasswordResetEmail(email: string): Promise<AuthActionResult> {
  passwordResetSchema.parse({ email });

  try {
    // 🔹 Controleer of gebruiker bestaat
    const user = await adminAuth.getUserByEmail(email).catch(() => null);
    if (!user) throw new Error('Geen gebruiker gevonden met dit e-mailadres.');

    // 🔹 Genereer password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    console.log(`[Auth] 🔑 Password reset link voor ${email}: ${resetLink}`);
    // TODO: hier e-mail versturen via SendGrid/SES/SMTP

    return { success: true, data: { redirectTo: '/' } };
  } catch (err: any) {
    console.error('[Auth] Password reset error:', err);
    return { success: false, error: err.message || 'Reset mislukt' };
  }
}
