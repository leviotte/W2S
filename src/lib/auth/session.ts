// src/lib/auth/session.ts
import 'server-only';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

// ============================================================================
// SESSION USER INTERFACE
// ============================================================================

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  username?: string | null;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isPartner?: boolean;
}

// ============================================================================
// SESSION DATA
// ============================================================================

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
}

// ============================================================================
// SESSION OPTIONS
// ============================================================================

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'wish2share_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  },
};

// ============================================================================
// CORE SESSION FUNCTIONS
// ============================================================================

/**
 * Get the current session
 * ✅ ENIGE PLEK waar getIronSession wordt aangeroepen
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Create a new session with user data
 * ✅ AANGEROEPEN: Na succesvolle Firebase login/register
 */
export async function createSession(user: Omit<SessionUser, 'isLoggedIn'>) {
  const session = await getSession();
  session.user = {
    ...user,
    isLoggedIn: true,
  };
  session.isLoggedIn = true;
  await session.save();
}

/**
 * Destroy the current session
 * ✅ AANGEROEPEN: Bij logout
 */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

/**
 * Update session user data
 * ✅ GEBRUIK: Voor profile updates zonder re-login
 */
export async function updateSessionUser(userData: Partial<SessionUser>) {
  const session = await getSession();
  
  if (!session.user) {
    throw new Error('No active session');
  }
  
  session.user = {
    ...session.user,
    ...userData,
  };
  
  await session.save();
}

// ============================================================================
// HELPER FUNCTIONS (voor convenience)
// ============================================================================

/**
 * Get current authenticated user or null
 */
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user && session.isLoggedIn ? session.user : null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn && !!session.user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.user?.isAdmin === true;
}

/**
 * Check if user is partner
 */
export async function isPartner(): Promise<boolean> {
  const session = await getSession();
  return session.user?.isPartner === true;
}