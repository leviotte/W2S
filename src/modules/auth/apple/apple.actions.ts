// src/modules/auth/apple/apple.actions.ts
'use server';

import { signIn } from 'next-auth/react';
import { verifyAppleIdToken } from './apple.server';
import { ensureUserProfileAction, getUserByEmail } from '@/lib/server/actions/user-actions';

interface AppleUser {
  sub: string;
  email: string;
  name?: string;      // optioneel
  picture?: string;   // optioneel
}

export async function signInWithAppleAction(idToken: string) {
  if (!idToken) throw new Error('Missing Apple token');

  // 🔹 Verifieer Apple token
  const appleUser = (await verifyAppleIdToken(idToken)) as AppleUser;

  if (!appleUser?.email) throw new Error('Apple token missing email');

  // 🔹 Check of user al bestaat
  let user = await getUserByEmail(appleUser.email);

  // 🔹 Als user niet bestaat, maak profiel aan
  if (!user) {
    const profile = await ensureUserProfileAction({
      uid: appleUser.sub,
      email: appleUser.email,
      displayName: appleUser.name ?? appleUser.email.split('@')[0],
      photoURL: appleUser.picture ?? null,
    });

    user = {
      id: profile.id,
      email: profile.email,
      name: profile.displayName ?? appleUser.email.split('@')[0], // ✅ fallback gegarandeerd string
      role: 'user',
      password: '', // dummy password voor credentials provider
    };
  }

  // 🔹 Zorg dat user niet null is voor login
  if (!user) throw new Error('User creation/login failed');

  // 🔹 Log de user in via NextAuth credentials provider
  const result = await signIn('credentials', {
    redirect: false,
    email: user.email,
    password: user.password || 'dummy', // fallback dummy password
  });

  if (!result?.ok) throw new Error('NextAuth login failed');

  return { success: true, user };
}
