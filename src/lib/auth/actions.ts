// src/lib/auth/actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Haalt de huidige ingelogde user op (of null)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Vereist admin rechten
 * Gooi error als gebruiker geen admin is
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Niet ingelogd');
  }

  if (session.user.role !== 'admin') {
    throw new Error('Admin toegang vereist');
  }

  return session.user;
}
