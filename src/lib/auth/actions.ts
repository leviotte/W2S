// src/lib/auth/actions.ts
'use server';

import { getSession, isAdmin } from './session.server';
import type { AuthenticatedSessionUser } from '@/types/session';

export async function getCurrentUser(): Promise<AuthenticatedSessionUser | null> {
  const { user } = await getSession();
  return user;
}

// ===============================
// requireAdmin helper
// ===============================
export async function requireAdmin(): Promise<AuthenticatedSessionUser> {
  const { user } = await getSession();
  if (!user?.isLoggedIn || !user.isAdmin) {
    throw new Error('Admin access vereist');
  }
  return user;
}
