// src/lib/server/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { getIronSession, type IronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/config/iron-session';
import { adminDb } from './firebase-admin';
import { userProfileSchema, type UserProfile } from '@/types';

// Haalt de huidige sessie op
export async function getSession(): Promise<IronSession<SessionData>> {
  // FIX: Wacht op de cookies() promise
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

// Haalt de huidige gebruiker uit de sessie en valideert deze eventueel
export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session.user?.id) {
    return null;
  }
  
  // Optioneel: valideer de gebruiker tegen Firebase Admin SDK bij elke request
  try {
    const userRecord = await adminDb.auth().getUser(session.user.id);
    if (!userRecord || userRecord.disabled) {
      await session.destroy();
      return null;
    }
  } catch (error) {
    await session.destroy();
    return null;
  }
  
  // De gebruiker in de sessie is al een volledig UserProfile object, dus we kunnen het direct teruggeven.
  return session.user as UserProfile;
}

/**
 * Functie om de volledige user profile data op te halen en in de sessie te plaatsen.
 * Dit is de sleutel tot het unificeren van onze types.
 * @param userId - De ID van de gebruiker.
 * @returns Het volledige UserProfile object.
 */
export async function createSessionUser(userId: string): Promise<UserProfile> {
  const userDocRef = adminDb.collection('users').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new Error('User document not found in Firestore.');
  }

  const userData = userDoc.data();
  
  // We valideren de data uit Firestore tegen ons Zod schema voor 100% type-veiligheid
  const validation = userProfileSchema.safeParse({ id: userDoc.id, ...userData });

  if (!validation.success) {
    console.error("Zod validation error creating session user:", validation.error.flatten());
    throw new Error("User data from Firestore is corrupt or invalid.");
  }
  
  return validation.data;
}