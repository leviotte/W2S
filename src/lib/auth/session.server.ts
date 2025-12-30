// src/lib/auth/session.server.ts
'use server';
import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { sessionUserSchema, type AuthenticatedSessionUser } from '@/types/session';

const SESSION_COOKIE = 'wish2share_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen
const SESSION_SECRET = process.env.SESSION_PASSWORD!;
if (!SESSION_SECRET) throw new Error('[Auth] SESSION_PASSWORD ontbreekt');

const sign = (value: string) =>
  createHmac('sha256', SESSION_SECRET).update(value).digest('hex');

const safeEqual = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function getSession(): Promise<{ user: AuthenticatedSessionUser | null }> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return { user: null };

    const [payload, signature] = raw.split('.');
    if (!payload || !signature || !safeEqual(sign(payload), signature)) return { user: null };

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    const parsed = sessionUserSchema.safeParse(decoded);
    if (!parsed.success) return { user: null };

    return { user: parsed.data };
  } catch (err) {
    console.error('[Session] getSession error:', err);
    return { user: null };
  }
}

export async function createSession(
  userData: Omit<AuthenticatedSessionUser, 'isLoggedIn' | 'createdAt' | 'lastActivity'>
) {
  const now = Date.now();
  const session: AuthenticatedSessionUser = { ...userData, isLoggedIn: true, createdAt: now, lastActivity: now };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = sign(payload);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: `${payload}.${signature}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set({ name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 });
}

export async function getUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.isLoggedIn ? user.id : null;
}

export async function getUserEmail(): Promise<string | null> {
  const { user } = await getSession();
  return user?.isLoggedIn ? user.email ?? null : null;
}

export async function isAdmin(): Promise<boolean> {
  const { user } = await getSession();
  return user?.isLoggedIn === true && user.isAdmin === true;
}

export async function isPartner(): Promise<boolean> {
  const { user } = await getSession();
  return user?.isLoggedIn === true && user.isPartner === true;
}

export async function isAuthenticatedSession(): Promise<boolean> {
  const { user } = await getSession();
  return user?.isLoggedIn === true;
}
