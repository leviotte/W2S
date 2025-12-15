// src/lib/auth/session.ts
/**
 * Iron Session Configuration
 * 
 * Beveiligde server-side sessie management met iron-session.
 * Sessions worden encrypted opgeslagen in cookies.
 * 
 * Features:
 * - User authentication state
 * - Role-based access (admin, partner)
 * - Profile data caching
 * - Secure cookie configuration
 * 
 * @see https://github.com/vvo/iron-session
 */
import 'server-only';
import { getIronSession, type IronSession } from 'iron-session';
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
  createdAt?: number;
  lastActivity?: number;
}

// ============================================================================
// SESSION DATA
// ============================================================================

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
}

// ============================================================================
// SESSION OPTIONS VALIDATION
// ============================================================================

function validateSessionPassword(): string {
  const password = process.env.SESSION_PASSWORD;

  if (!password) {
    throw new Error(
      '[Iron Session] Fatal Error: SESSION_PASSWORD environment variable is niet ingesteld.\n' +
        'Voeg deze toe aan je .env.local file met een random string van minimaal 32 characters.'
    );
  }

  if (password.length < 32) {
    throw new Error(
      `[Iron Session] Fatal Error: SESSION_PASSWORD moet minimaal 32 characters lang zijn.\n` +
        `Huidige lengte: ${password.length} characters.\n` +
        'Genereer een nieuwe random string van minimaal 32 characters.'
    );
  }

  return password;
}

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

export const sessionOptions = {
  password: validateSessionPassword(),
  cookieName: 'wish2share_session',
  cookieOptions: {
    // Secure cookies in productie (alleen HTTPS)
    secure: process.env.NODE_ENV === 'production',
    // HttpOnly voorkomt JavaScript toegang tot de cookie
    httpOnly: true,
    // SameSite beschermt tegen CSRF attacks
    sameSite: 'lax' as const,
    // Cookie verloopt na 30 dagen
    maxAge: 60 * 60 * 24 * 30, // 30 dagen in seconden
    // Path waar de cookie geldig is
    path: '/',
  },
  // TTL (Time To Live) van de sessie data
  ttl: 60 * 60 * 24 * 30, // 30 dagen in seconden
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
export async function createSession(user: Omit<SessionUser, 'isLoggedIn' | 'createdAt' | 'lastActivity'>) {
  const session = await getSession();
  const now = Date.now();
  
  session.user = {
    ...user,
    isLoggedIn: true,
    createdAt: now,
    lastActivity: now,
  };
  session.isLoggedIn = true;
  
  await session.save();
  
  console.log(`[Session] ✅ Session created for user: ${user.email}`);
}

/**
 * Destroy the current session
 * ✅ AANGEROEPEN: Bij logout
 */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
  
  console.log('[Session] 🔓 Session destroyed (logout)');
}

/**
 * Update session user data
 * ✅ GEBRUIK: Voor profile updates zonder re-login
 */
export async function updateSessionUser(userData: Partial<SessionUser>) {
  const session = await getSession();

  if (!session.user) {
    throw new Error('[Session] No active session to update');
  }

  session.user = {
    ...session.user,
    ...userData,
    lastActivity: Date.now(),
  };

  await session.save();
  
  console.log(`[Session] 🔄 Session updated for user: ${session.user.email}`);
}

/**
 * Update session activity timestamp
 * ✅ GEBRUIK: Voor activity tracking (optioneel)
 */
export async function updateSessionActivity(): Promise<void> {
  try {
    const session = await getSession();
    if (session.isLoggedIn && session.user) {
      session.user.lastActivity = Date.now();
      await session.save();
    }
  } catch (error) {
    console.error('[Session] Error updating session activity:', error);
  }
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
 * Get user ID from session
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session.user?.id || null;
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

// ============================================================================
// EXPORTS
// ============================================================================

export type { IronSession };