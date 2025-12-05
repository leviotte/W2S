/**
 * src/lib/server/auth.ts
 *
 * Beheert server-side authenticatie: sessie-cookies aanmaken, valideren en verwijderen.
 * Deze functies zijn Server Actions en kunnen direct vanuit de client worden aangeroepen.
 */
'use server'; // Markeer alle exports in dit bestand als Server Actions

import 'server-only'; // Zorg ervoor dat deze module nooit in een client bundle terechtkomt
import { cache } from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebaseAdmin'; // FIX: Correcte imports!
import { z } from 'zod';

// Definieer een schema voor de data die we van een ingelogde gebruiker verwachten.
// Dit is veiliger dan 'as UserData'.
const authedUserSchema = z.object({
  uid: z.string(),
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  // Voeg hier andere velden toe die je van het 'user' document verwacht
});

// Genereer een TypeScript type van het schema
export type AuthedUser = z.infer<typeof authedUserSchema>;

/**
 * Maakt een sessie-cookie aan op de server na een succesvolle client-side login.
 * @param idToken De ID token van de Firebase client SDK.
 */
export async function createSession(idToken: string) {
  // Sessie duurt 7 dagen.
  const expiresIn = 60 * 60 * 24 * 7 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn }); // FIX: Typo 'sessi'

  // FIX: `cookies()` is async, dus we moeten `await` gebruiken.
  const cookieStore = await cookies();
  cookieStore.set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresIn,
    path: '/',
  });
}

/**
 * Verwijdert het sessie-cookie om de gebruiker uit te loggen.
 */
export async function clearSession() {
  // FIX: `cookies()` is async, dus we moeten `await` gebruiken.
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Haalt de huidige ingelogde gebruiker op, gebaseerd op het sessie-cookie.
 * Gewrapped in `cache` voor performance: voorkomt meerdere DB-calls per request.
 * Dit is een van de krachtigste features van de App Router!
 */
export const getCurrentUser = cache(
  async (): Promise<AuthedUser | null> => {
    // FIX: `cookies()` is async, dus we moeten `await` gebruiken.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    try {
      // Verifieer het cookie met de Firebase Admin SDK
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      const { uid } = decodedToken;

      // Haal de bijhorende profielinformatie op uit de 'users' of 'profiles' collectie
      const userDocRef = adminDb.collection('users').doc(uid); // Pas aan naar 'profiles' indien nodig
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.warn(`[Auth] User document not found for UID: ${uid}`);
        return null;
      }
      
      const userData = userDoc.data();

      // VERBETERING: Valideer de data met Zod in plaats van 'as UserData'
      const result = authedUserSchema.safeParse({
        ...userData,
        id: userDoc.id,
        uid: userDoc.id,
      });

      if (!result.success) {
        console.error(`[Auth] Corrupte gebruikersdata voor UID ${uid}:`, result.error.issues);
        return null;
      }
      
      return result.data;

    } catch (error) {
      console.error('[Auth] Error verifying session cookie:', error);
      clearSession(); // Ruim het ongeldige of verlopen cookie op
      return null;
    }
  }
);