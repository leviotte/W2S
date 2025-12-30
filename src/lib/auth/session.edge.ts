// src/lib/auth/session.edge.ts
import { cookies } from 'next/headers';

export type EdgeSessionUser = {
  isLoggedIn: boolean;
  isAdmin?: boolean;
};

export async function getEdgeSession(): Promise<{ user: EdgeSessionUser }> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session')?.value;

  if (!raw) {
    return { user: { isLoggedIn: false } };
  }

  // ⚠️ GEEN crypto, GEEN verify
  // Middleware mag enkel presence checken
  return {
    user: {
      isLoggedIn: true,
      // optioneel: simpele flag encoded in cookie
    },
  };
}
