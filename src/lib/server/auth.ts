// src/lib/server/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { type SessionData, sessionOptions } from '@/lib/server/session';
import { type AuthedUser } from '@/types/user';

/**
 * Haalt de volledige sessie op. Bevat de ingelogde gebruiker.
 */
export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

/**
 * Haalt het volledige, gevalideerde gebruikersprofiel op uit de sessie.
 * Geeft direct het volledige profiel terug ZONDER extra database-aanroep.
 * @returns {Promise<AuthedUser | null>} Het volledige gebruikersobject of null.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return null;
  }

  // Hier zou je eventueel een Zod .safeParse kunnen doen als extra veiligheidscheck,
  // maar omdat we het object zelf in de sessie zetten, is dit meestal niet nodig.
  return session.user;
}