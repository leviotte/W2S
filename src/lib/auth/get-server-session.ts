// src/lib/auth/get-server-session.ts
import 'server-only';
import { getSession } from './session';

/**
 * Server session return type
 */
export type ServerSession = {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null | undefined;
    firstName: string;
    lastName: string;
    username: string | null | undefined;
    isAdmin: boolean | undefined;
    isPartner: boolean | undefined;
  } | null;
  isAdmin: boolean; // ✅ TOEGEVOEGD - voor makkelijke toegang
};

/**
 * Haal server session op
 * Gebruikt je bestaande Iron Session implementatie
 */
export async function getServerSession(): Promise<ServerSession> {
  const session = await getSession();
  
  const user = session.isLoggedIn && session.user ? {
    uid: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    photoURL: session.user.photoURL,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    username: session.user.username,
    isAdmin: session.user.isAdmin,
    isPartner: session.user.isPartner,
  } : null;

  return {
    user,
    isAdmin: user?.isAdmin === true, // ✅ TOEGEVOEGD
  };
}