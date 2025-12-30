// src/lib/auth/get-server-session.ts
import { getSession } from './session.server';
import type { SessionUser, AuthenticatedSessionUser, AnonymousSessionUser } from '@/types/session';
import { isAuthenticated } from '@/types/session';

export async function getServerSession(): Promise<{ user: SessionUser }> {
  const rawSession = await getSession();

  if (!rawSession?.user || !isAuthenticated(rawSession.user)) {
    // Anonieme user
    const anonymous: AnonymousSessionUser = { isLoggedIn: false };
    return { user: anonymous };
  }

  // Authenticated user
  const user: AuthenticatedSessionUser = {
    isLoggedIn: true,
    id: rawSession.user.id!,
    email: rawSession.user.email ?? '',
    displayName: rawSession.user.displayName ?? '',
    isAdmin: rawSession.user.isAdmin ?? false,
    isPartner: rawSession.user.isPartner ?? false,
    firstName: rawSession.user.firstName,
    lastName: rawSession.user.lastName,
    photoURL: rawSession.user.photoURL ?? null,
    username: rawSession.user.username ?? null,
    createdAt: rawSession.user.createdAt,
    lastActivity: rawSession.user.lastActivity,
  };

  return { user };
}
