/**
 * src/lib/server/auth.ts
 *
 * Beheert de core server-side authenticatie logica.
 * - Sessie-cookies aanmaken en verwijderen.
 * - Huidige gebruiker ophalen en valideren.
 * Dit is de centrale 'single source of truth' voor sessies.
 */
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebaseAdmin';
import { z } from 'zod';
import { DecodedIdToken } from 'firebase-admin/auth';

const userProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoURL: z.string().url().optional(),
});

export type AuthedUser = DecodedIdToken & z.infer<typeof userProfileSchema>;

/**
 * Maakt een sessie-cookie aan. Dit is de centrale functie hiervoor.
 */
export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 dagen
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  
  // HET CORRECTE PATROON (met await)
  const cookieStore = await cookies();
  cookieStore.set('session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: expiresIn,
    path: '/',
  });
}

/**
 * Verwijdert het sessie-cookie. Dit is de centrale functie hiervoor.
 */
export async function clearSessionCookie() {
  // HET CORRECTE PATROON (met await)
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Haalt de huidige ingelogde gebruiker op, gebaseerd op het sessie-cookie.
 * Gebruikt React `cache` om database-aanroepen binnen één request te optimaliseren.
 */
export const getCurrentUser = cache(
  async (): Promise<AuthedUser | null> => {
    // HET CORRECTE PATROON (met await)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        console.warn(`[Auth] User document niet gevonden voor UID: ${decodedToken.uid}. Sessie wordt gewist.`);
        await clearSessionCookie();
        return null;
      }
      
      const userProfileData = userDoc.data();
      const profileValidation = userProfileSchema.safeParse(userProfileData);

      if (!profileValidation.success) {
        console.error(`[Auth] Invalide gebruikersprofiel voor UID ${decodedToken.uid}:`, profileValidation.error.format());
        return decodedToken as AuthedUser; // Fallback naar token data
      }
      
      return {
        ...decodedToken,
        ...profileValidation.data,
      };

    } catch (error) {
      console.warn('[Auth] Invalide sessie-cookie gedetecteerd. Sessie wordt gewist.');
      await clearSessionCookie();
      return null;
    }
  }
);