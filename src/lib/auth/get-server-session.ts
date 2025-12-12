// src/lib/auth/get-server-session.ts
import 'server-only';
import { getSession } from './session';
import type { SessionUser } from './session';

/**
 * Alias voor getSession() - voor compatibility met profile page
 * Gebruikt je bestaande Iron Session implementatie
 */
export async function getServerSession() {
  const session = await getSession();
  
  return {
    user: session.isLoggedIn && session.user ? {
      uid: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      photoURL: session.user.photoURL,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      username: session.user.username,
      isAdmin: session.user.isAdmin,
      isPartner: session.user.isPartner,
    } : null,
  };
}