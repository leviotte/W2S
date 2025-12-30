// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/get-server-session';
import { destroySession } from '@/lib/auth/session.server'; // destroySession blijft, want dat moet nog de cookie verwijderen

export async function POST() {
  try {
    const { user } = await getServerSession(); // altijd een SessionUser

    // Alleen vernietigen als ingelogd
    if (user.isLoggedIn) {
      await destroySession();
    }

    return NextResponse.json({ message: 'Succesvol uitgelogd' });
  } catch (error: any) {
    console.error('[Auth API] Logout Fout:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het uitloggen' },
      { status: 500 }
    );
  }
}
