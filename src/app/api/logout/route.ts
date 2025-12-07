// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';

export async function POST() {
  try {
    const session = await getSession();
    session.destroy(); // Vernietigt de sessie en verwijdert de cookie

    return NextResponse.json({ message: 'Succesvol uitgelogd' });
    
  } catch (error: any) {
    console.error('[Auth API] Logout Fout:', error.message);
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het uitloggen' }, { status: 500 });
  }
}