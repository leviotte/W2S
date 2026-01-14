// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth/session.server';

export async function POST() {
  try {
    const { user } = await getSession(); // altijd een SessionUser of null

    // Alleen vernietigen als ingelogd
    if (user) {
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
