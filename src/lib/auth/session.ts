// src/lib/auth/session.ts
'use server';

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  sessionUserSchema,
  type SessionUser,
  type AuthenticatedSessionUser,
} from '@/types/session';

const SESSION_COOKIE_NAME = 'wish2share_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen
const SESSION_SECRET = process.env.SESSION_PASSWORD;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('[Session] SESSION_PASSWORD ontbreekt of is te kort (min 32 chars)');
}

// ===========================
// Helpers
// ===========================

const base64UrlEncode = (str: string): string =>
  Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const base64UrlDecode = (str: string): string => {
  let input = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64').toString('utf-8');
};

const hashValue = (value: string): string =>
  createHmac('sha256', SESSION_SECRET!).update(value).digest('hex');

const safeTimingEqual = (a: string, b: string): boolean =>
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));

// ===========================
// Core Session Logic
// ===========================

export async function getSession(): Promise<{ user: SessionUser }> {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawCookie) return { user: { isLoggedIn: false } };

    const [payloadB64, signature] = rawCookie.split('.');
    if (!payloadB64 || !signature) return { user: { isLoggedIn: false } };

    const expectedSig = hashValue(payloadB64);
    if (!safeTimingEqual(signature, expectedSig)) {
      console.warn('[Session] Ongeldige cookie signature');
      return { user: { isLoggedIn: false } };
    }

    const payloadStr = base64UrlDecode(payloadB64);
    const parsed = JSON.parse(payloadStr);

    const result = sessionUserSchema.safeParse(parsed);
    if (!result.success) return { user: { isLoggedIn: false } };

    return { user: result.data };
  } catch (err) {
    console.error('[Session] Fout bij parsen cookie:', err);
    return { user: { isLoggedIn: false } };
  }
}

export async function createSession(
  userData: Omit<AuthenticatedSessionUser, 'isLoggedIn' | 'createdAt' | 'lastActivity'>
): Promise<void> {
  const now = Date.now();

  const session: AuthenticatedSessionUser = {
    ...userData,
    isLoggedIn: true,
    createdAt: now,
    lastActivity: now,
  };

  const payloadStr = JSON.stringify(session);
  const payloadB64 = base64UrlEncode(payloadStr);
  const signature = hashValue(payloadB64);
  const cookieValue = `${payloadB64}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });
}

// ===========================
// Shortcuts
// ===========================

export async function getUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user.isLoggedIn ? user.id : null;
}

export async function getUserEmail(): Promise<string | null> {
  const { user } = await getSession();
  return user.isLoggedIn ? user.email : null;
}

export async function isAuthenticatedSession(): Promise<boolean> {
  const { user } = await getSession();
  return user.isLoggedIn === true;
}

export async function isAdmin(): Promise<boolean> {
  const { user } = await getSession();
  return user.isLoggedIn === true && user.isAdmin === true;
}

export async function isPartner(): Promise<boolean> {
  const { user } = await getSession();
  return user.isLoggedIn === true && user.isPartner === true;
}
