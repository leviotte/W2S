// src/lib/auth/active-profile.ts
import { cookies } from 'next/headers';

export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('activeProfileId');
  if (!cookie) return 'main-account';
  return cookie.value || 'main-account';
}