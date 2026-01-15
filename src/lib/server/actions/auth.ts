// src/lib/server/actions/auth.ts
'use server';

import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { ensureUserProfileAction, getUserByEmail } from './user-actions';
import { redirect } from 'next/navigation';

/* ============================================================================
 * HELPER: fallback user zodat TS nooit null ziet
 * ========================================================================== */
function ensureUser(
  user: Awaited<ReturnType<typeof getUserByEmail>>,
  email: string
): {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  password: string;
} {
  if (user) {
    return {
      id: user.id,
      email: user.email ?? email,
      name: user.name ?? user.email?.split('@')[0] ?? 'Gebruiker',
      role: user.role === 'admin' ? 'admin' : 'user', // ✅ fix
      password: user.password ?? 'dummy',
    };
  }

  // fallback als user nog niet bestaat
  return {
    id: crypto.randomUUID(),
    email,
    name: email.split('@')[0],
    role: 'user',
    password: 'dummy',
  };
}

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
 * REGISTRATION
 * ========================================================================== */
const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().min(6), // optioneel: password bij credentials
});

export async function completeRegistrationAction(data: z.infer<typeof registerSchema>): Promise<AuthActionResult> {
  try {
    const rawUser = await getUserByEmail(data.email);
    const user = ensureUser(rawUser, data.email);

    // Maak profiel aan als nodig
    if (!rawUser) {
      await ensureUserProfileAction({
        uid: user.id,
        email: user.email,
        displayName: `${data.firstName} ${data.lastName}`,
        photoURL: null,
      });
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: user.email,
      password: user.password,
    });

    if (!result?.ok) throw new Error('Login na registratie mislukt');

    return { success: true, data: { userId: user.id, redirectTo: '/dashboard' } };
  } catch (err: any) {
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
    const rawUser = await getUserByEmail(parsed.email);
    const user = ensureUser(rawUser, parsed.email);

    const result = await signIn('credentials', {
      redirect: false,
      email: user.email,
      password: user.password,
    });

    if (!result?.ok) throw new Error('Login mislukt');

    return { success: true, data: { userId: user.id, redirectTo: user.role === 'admin' ? '/admin' : '/dashboard' } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login mislukt' };
  }
}

/* ============================================================================
 * SOCIAL LOGIN (GOOGLE / APPLE)
 * ========================================================================== */
const socialLoginSchema = z.object({
  email: z.string().email(),
  provider: z.enum(['google', 'apple']),
});

export async function socialLoginAction(data: z.infer<typeof socialLoginSchema>): Promise<AuthActionResult> {
  try {
    const rawUser = await getUserByEmail(data.email);
    const user = ensureUser(rawUser, data.email);

    // Maak profiel aan als het nog niet bestaat
    if (!rawUser) {
      await ensureUserProfileAction({
        uid: user.id,
        email: user.email,
        displayName: user.name,
        photoURL: null,
      });
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: user.email,
      password: user.password,
    });

    if (!result?.ok) throw new Error('Social login mislukt');

    return { success: true, data: { userId: user.id, redirectTo: '/dashboard' } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Social login mislukt' };
  }
}

/* ============================================================================
 * LOGOUT
 * ========================================================================== */
export async function logoutAction(): Promise<AuthActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: true }; // al uitgelogd

    // NextAuth regelt cookies automatisch bij signOut op client
    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Logout error:', err);
    return { success: false, error: err.message || 'Logout mislukt' };
  }
}

/* ============================================================================
 * PASSWORD RESET
 * ========================================================================== */
export async function sendPasswordResetEmail(email: string): Promise<AuthActionResult> {
  try {
    // 🔹 Zoek user
    const user = await getUserByEmail(email);
    if (!user) throw new Error('Geen gebruiker gevonden met dit e-mailadres.');

    // 🔹 In Auth.js kun je password reset via provider implementeren
    // Hier loggen we voorlopig de intentie
    console.log(`[Auth] 🔑 Password reset requested for ${email}`);

    return { success: true, data: { redirectTo: '/' } };
  } catch (err: any) {
    console.error('[Auth] Password reset error:', err);
    return { success: false, error: err.message || 'Reset mislukt' };
  }
}
