// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';
import { adminDb, adminAuth } from '@/lib/server/firebase-admin';
import { sessionUserSchema, type SessionUser } from '@/types/user';

/**
 * Interne functie om de user profile data op te halen en te valideren.
 * Wordt ENKEL hier gebruikt bij het inloggen.
 */
async function createAndValidateSessionUser(userId: string): Promise<SessionUser> {
  const userDocRef = adminDb.collection('users').doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new Error('Gebruikersdocument niet gevonden in Firestore.');
  }

  const userData = userDoc.data();
  
  // Valideer de data uit Firestore tegen ons Zod schema.
  const validation = sessionUserSchema.safeParse({ id: userDoc.id, ...userData });

  if (!validation.success) {
    console.error("Zod validatie fout bij aanmaken sessie gebruiker:", validation.error.flatten());
    throw new Error("Gebruikersdata uit Firestore is corrupt of ongeldig.");
  }
  
  return validation.data;
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is vereist' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const userProfileForSession = await createAndValidateSessionUser(userId);

    const session = await getSession();
    session.user = userProfileForSession;
    session.isLoggedIn = true; // Cruciaal voor de check in getCurrentUser!
    await session.save();

    return NextResponse.json(userProfileForSession);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error("[Login API] Fout:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}