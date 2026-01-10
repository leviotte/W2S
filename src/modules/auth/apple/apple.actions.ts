// app/actions/auth/apple.ts
'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/server/firebase-admin';
import { verifyAppleIdToken } from '@/modules/auth/apple/apple.server';

export async function signInWithAppleAction(idToken: string) {
  if (!idToken) throw new Error('Missing Apple token');

  const appleUser = await verifyAppleIdToken(idToken);

  // Create or get Firebase user
  await adminAuth.getUserByEmail(appleUser.email).catch(async () => {
    return adminAuth.createUser({
      uid: appleUser.sub,
      email: appleUser.email,
      emailVerified: true,
    });
  });

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: 1000 * 60 * 60 * 24 * 7,
  });

  // **Correct:** await cookies() then .set()
  const cookieStore = await cookies();
  cookieStore.set('session', sessionCookie, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  });

  return { success: true };
}
