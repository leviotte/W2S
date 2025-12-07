// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { getSession, createSessionUser } from '@/lib/server/auth';
import { adminAuth } from '@/lib/server/firebase-admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is vereist' }, { status: 400 });
    }

    // Verifieer het ID token met Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Haal de volledige user profile data op
    const userProfile = await createSessionUser(uid);

    // Sla het volledige, gevalideerde UserProfile op in de sessie
    const session = await getSession();
    session.user = userProfile;
    await session.save();

    console.log(`[Auth API] Sessie succesvol aangemaakt voor gebruiker: ${userProfile.firstName}`);
    return NextResponse.json(userProfile);

  } catch (error: any) {
    console.error('[Auth API] Login Fout:', error.message);
    return NextResponse.json({ error: 'Authenticatie mislukt', details: error.message }, { status: 401 });
  }
}