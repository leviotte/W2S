// src/lib/auth/session.ts
/**
 * Iron Session Configuration
 * 
 * Beveiligde server-side sessie management met iron-session.
 * Sessions worden encrypted opgeslagen in cookies.
 * 
 * ⚠️ BELANGRIJK: Cookies hebben een limiet van ~4KB
 * → Bewaar ALLEEN essentiële data, geen grote objecten!
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
  // ✅ Essential identifiers
  id: string;                    // Firebase UID
  email: string;                 // User email
  
  // ✅ Display info (short strings only!)
  firstName: string;             // Voor UI display
  lastName: string;              // Voor UI display
  displayName: string;           // Full name voor UI
  photoURL?: string | null;      // Avatar URL (kort!)
  username?: string | null;      // Username voor profile URLs
  
  // ✅ Role flags (tiny!)
  isAdmin?: boolean;             // Admin access
  isPartner?: boolean;           // Partner access
  
  // ✅ Timestamps (small)
  createdAt: number;             // Session creation
  lastActivity: number;          // Last activity
  
  // ❌ NIET IN SESSION:
  // - Hele user profile objects
  // - Arrays (wishlists, events, etc.)
  // - Nested objects (address, preferences, etc.)
  // → Deze haal je op uit Firestore wanneer nodig!
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
 * 
 * ⚠️ CRITICAL: Accepteert ALLEEN minimale strings, GEEN objecten/arrays!
 */
export async function createSession(userData: {
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
  const session = await getSession();
  const now = Date.now();
  
  // ✅ KRITISCH: Alleen primitieve types, GEEN objecten/arrays!
  session.user = {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    displayName: userData.displayName,
    photoURL: userData.photoURL || null,
    username: userData.username || null,
    isAdmin: userData.isAdmin || false,
    isPartner: userData.isPartner || false,
    createdAt: now,
    lastActivity: now,
  };
  session.isLoggedIn = true;
  
  await session.save();
  
  // ✅ Cookie size debugging
  const cookieSize = JSON.stringify(session.user).length;
  console.log(`[Session] ✅ Session created for user: ${userData.email}`);
  console.log(`[Session] 📊 Cookie size: ${cookieSize} bytes (max 4096)`);
  
  if (cookieSize > 2000) {
    console.warn(`[Session] ⚠️  Cookie size is getting large: ${cookieSize} bytes`);
  }
  
  if (cookieSize > 4096) {
    console.error(`[Session] ❌ CRITICAL: Cookie exceeds 4KB limit! Size: ${cookieSize} bytes`);
    console.error('[Session] Session data:', JSON.stringify(session.user, null, 2));
    throw new Error(`Session cookie too large: ${cookieSize} bytes (max 4096)`);
  }
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
 * Update session flags (admin/partner status)
 * ✅ GEBRUIK: Voor role updates zonder re-login
 */
export async function updateSessionFlags(flags: {
  isAdmin?: boolean;
  isPartner?: boolean;
}) {
  const session = await getSession();

  if (!session.user) {
    throw new Error('[Session] No active session to update');
  }

  session.user = {
    ...session.user,
    ...flags,
    lastActivity: Date.now(),
  };

  await session.save();
  
  console.log(`[Session] 🔄 Session flags updated for user: ${session.user.email}`);
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
 * Get current authenticated user ID or null
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session.user?.id || null;
}

/**
 * Get current authenticated user email or null
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session.user?.email || null;
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

// ============================================================================
// EXPORTS
// ============================================================================

export type { IronSession };