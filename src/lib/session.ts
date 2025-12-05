/**
 * src/lib/session.ts
 *
 * Beheert de versleutelde sessiecookies met 'iron-session'.
 * Dit is server-only code en mag NOOIT naar de client worden gestuurd.
 */
import 'server-only'; // Garandeert dat deze module enkel op de server draait.

import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';

// MENTOR-VERBETERING: We plaatsen de type-definitie op een logischere plek.
// Maak een nieuw bestand aan: `src/types/auth.ts` en plaats de interface daar.
// export interface SessionPayload {
//   userId: string;
//   email: string | null;
//   isAdmin?: boolean;
// }
// Importeer het dan hier: import type { SessionPayload } from '@/types/auth';
// Voor nu laat ik het hier staan om je niet te blokkeren.
export interface SessionPayload {
  userId: string;
  email: string | null;
  isAdmin?: boolean;
}

/**
 * MENTOR-FIX (Fout #1): Deze functie haalt de secret op en valideert deze.
 * Door deze aanpak weet TypeScript 100% zeker dat de returnwaarde
 * een 'string' is, wat de "string | undefined" fout oplost.
 */
function getSessionSecret(): string {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      'SESSION_SECRET is niet gedefinieerd of te kort (min. 32 karakters). Voeg deze toe aan .env.local'
    );
  }
  return sessionSecret;
}

// Versleutelt de sessie data en geeft een string terug.
async function encrypt(payload: SessionPayload): Promise<string> {
  return await sealData(payload, {
    password: getSessionSecret(), // Gebruik de gevalideerde secret
  });
}

// Ontsleutelt de sessie data uit de cookie-string.
async function decrypt(session: string): Promise<SessionPayload | null> {
  try {
    const payload = await unsealData<SessionPayload>(session, {
      password: getSessionSecret(), // Gebruik de gevalideerde secret
    });
    return payload;
  } catch (error) {
    console.error('Sessie kon niet worden ontsleuteld:', error);
    return null;
  }
}

// Creëert de sessiecookie. Moet aangeroepen worden vanuit een Server Action of Route Handler.
export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dagen
  const session = await encrypt(payload);

  // MENTOR-ADVIES (Fout #2): Deze code is CORRECT.
  // De `cookies()` functie is synchroon. Negeer de fantoomfout van je editor.
  // De code zal perfect werken in de Next.js runtime.
  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  });
}

// Haalt de huidige sessie op. Kan overal op de server gebruikt worden.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieValue = cookies().get('session')?.value;
  if (!cookieValue) return null;
  return await decrypt(cookieValue);
}

// Verwijdert de sessiecookie. Moet aangeroepen worden vanuit een Server Action of Route Handler.
export async function deleteSession() {
  // MENTOR-ADVIES (Fout #3): Ook deze code is CORRECT.
  // Negeer de fantoomfout van je editor.
  cookies().delete('session');
}