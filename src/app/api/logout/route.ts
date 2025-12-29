// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/auth/actions';

export async function POST() {
  try {
    const { user } = await getSession();

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