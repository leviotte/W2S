/**
 * src/lib/server/auth.ts
 *
 * Beheert server-side authenticatie: sessie-cookies aanmaken, valideren en verwijderen.
 * Dit is de definitieve, 'gold standard' versie voor de Next.js App Router.
 */
'use server';

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebaseAdmin';
import { z } from 'zod';
import { DecodedIdToken } from 'firebase-admin/auth';

// Schema voor de gebruikersdata die we uit Firestore halen.
// VERBETERD: Aangepast om consistent te zijn met je UserProfile type.
const userProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoURL: z.string().url().optional(),
  // Voeg hier andere velden uit je 'users' document toe die je wilt gebruiken
});

// Het uiteindelijke gebruikerstype: een combinatie van de token-info en profiel-info.
export type AuthedUser = DecodedIdToken & z.infer<typeof userProfileSchema>;

/**
 * Maakt een sessie-cookie aan op de server na een succesvolle client-side login.
 */
export async function createSession(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 dagen
  // FIX: Syntaxfout hier, 'const sessionCookie =' was onvolledig.
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  cookies().set('session', sessionCookie, {
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
  cookies().delete('session');
}

/**
 * Haalt de huidige ingelogde gebruiker op, gebaseerd op het sessie-cookie.
 * Gewrapped in `React.cache` voor maximale performance: voorkomt dubbele database-queries per request.
 */
export const getCurrentUser = cache(
  async (): Promise<AuthedUser | null> => {
    // FIX: Syntaxfout hier, 'const sessionCookie =' was onvolledig.
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        console.warn(`[Auth] User document not found for UID: ${decodedToken.uid}. Clearing session.`);
        // Belangrijk: ruim de ongeldige sessie op.
        await clearSession();
        return null;
      }
      
      const userProfileData = userDoc.data();
      const profileValidation = userProfileSchema.safeParse(userProfileData);

      if (!profileValidation.success) {
        console.error(`[Auth] Invalid user profile data for UID ${decodedToken.uid}:`, profileValidation.error.format());
        return decodedToken as AuthedUser; // Geef token terug, maar zonder (foute) profiel data.
      }
      
      return {
        ...decodedToken,
        ...profileValidation.data,
      };

    } catch (error) {
      console.warn('[Auth] Invalid session cookie detected. Clearing session.');
      await clearSession();
      return null;
    }
  }
);