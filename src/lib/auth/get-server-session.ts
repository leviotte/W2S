// src/lib/auth/get-server-session.ts
import { getSession } from './session';
import type { SessionUser, AuthenticatedSessionUser, Session, isAuthenticated } from '@/types/session';

export async function getServerSession(): Promise<{ user: SessionUser }> {
  const rawSession = await getSession();

  // Guest fallback
  if (!rawSession || !('user' in rawSession) || !rawSession.user.isLoggedIn) {
    return { user: { isLoggedIn: false } };
  }

  // TS-safe assign
  const user: AuthenticatedSessionUser = {
    ...rawSession.user,
    // Add any extra fields if needed!
  };

  return { user };
}