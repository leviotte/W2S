import { NextResponse } from 'next/server';
import { createSession } from '@/lib/server/auth';

/**
 * API Route Handler voor het aanmaken van een server-side sessie.
 * Ontvangt de Firebase ID token van de client en maakt een
 * veilige, HttpOnly session cookie aan.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      // Consistent fout-antwoord
      return NextResponse.json(
        { success: false, message: 'ID token is vereist.' },
        { status: 400 }
      );
    }

    // Dit is de 'write context' waar createSession perfect werkt.
    await createSession(idToken);

    // Consistent succes-antwoord
    return NextResponse.json(
      { success: true, message: 'Sessie succesvol aangemaakt.' },
      { status: 200 }
    );
      
  } catch (error) {
    console.error('[API Login] Fout bij aanmaken sessie:', error);
    // Consistent fout-antwoord
    return NextResponse.json(
      { success: false, message: 'Interne serverfout opgetreden.' },
      { status: 500 }
    );
  }
}