// src/lib/auth/actions.ts
'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sessionOptions, type SessionData } from '@/lib/server/session';
import { getUserProfileById } from '../server/data/users';

// Deze functie haalt de sessie op. Het is de CENTRALE manier om te checken of iemand ingelogd is.
export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    return null;
  }
  return session;
}

export async function createSession(uid: string) {
  const userProfile = await getUserProfileById(uid);
  if (!userProfile) {
    // Dit zou niet mogen gebeuren als een gebruiker kan inloggen
    throw new Error('Kon geen profiel vinden voor de ingelogde gebruiker.');
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.isLoggedIn = true;
  session.user = userProfile; // Sla het volledige, gestroomlijnde profiel op
  await session.save();

  // Revalideer paden die afhankelijk zijn van de auth-status
  revalidatePath('/', 'layout');
}

export async function logoutAction() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  revalidatePath('/', 'layout');
  redirect('/'); // Stuur gebruiker terug naar de homepage na uitloggen
}