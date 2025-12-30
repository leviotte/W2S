// src/lib/auth/active-profile.ts
import { cookies } from 'next/headers';

export async function getActiveProfileId(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('activeProfileId');
  return cookie?.value || 'main-account';
}
