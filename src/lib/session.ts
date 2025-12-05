/**
 * src/lib/session.ts
 *
 * Beheert de versleutelde sessiecookies met 'iron-session'.
 * Dit is server-only code en mag NOOIT naar de client worden gestuurd.
 */
import 'server-only'; // Garandeert dat deze module enkel op de server draait.

import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';

// DEZE CHECK IS CRUCIAAL voor zowel veiligheid als type-veiligheid.
const sessionSecret = process.env.SESSION_SECRET;

// Deze 'if'-block fungeert als een type guard. Na deze check weet TypeScript
// dat 'sessionSecret' een 'string' is en geen 'undefined' meer kan zijn.
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET is niet gedefinieerd of te kort (min. 32 karakters). Voeg deze toe aan .env.local'
  );
}

// Type definitie voor onze sessie data.
export interface SessionPayload {
  userId: string;
  email: string | null;
  isAdmin?: boolean;
}

// Versleutelt de sessie data en geeft een string terug.
async function encrypt(payload: SessionPayload): Promise<string> {
  return await sealData(payload, {
    password: sessionSecret, // TypeScript weet nu dat dit een 'string' is.
  });
}

// Ontsleutelt de sessie data uit de cookie-string.
async function decrypt(session: string): Promise<SessionPayload | null> {
  try {
    const payload = await unsealData<SessionPayload>(session, {
      password: sessionSecret, // TypeScript weet nu dat dit een 'string' is.
    });
    return payload;
  } catch (error) {
    console.error('Sessie kon niet worden ontsleuteld:', error);
    return null;
  }
}

// Creëert de sessiecookie.
export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dagen
  const session = await encrypt(payload);

  // De 'cookies()' functie van 'next/headers' is synchroon. De fout in je editor is een "fantoomfout".
  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  });
}

// Haalt de huidige sessie op.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieValue = cookies().get('session')?.value;
  if (!cookieValue) return null;
  return await decrypt(cookieValue);
}

// Verwijdert de sessiecookie.
export async function deleteSession() {
  cookies().delete('session');
}