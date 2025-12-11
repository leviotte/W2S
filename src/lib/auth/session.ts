// src/lib/auth/session.ts
import type { SessionOptions } from 'iron-session';
import type { SessionUser } from '@/types/user';

/**
 * Iron Session configuratie
 * BEST PRACTICE: Session data wordt encrypted opgeslagen in cookie
 */
export interface SessionData {
  user?: SessionUser;
}

/**
 * Session opties voor iron-session
 */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'wish2share_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dagen
    path: '/',
  },
};

// Type guard check voor runtime
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long');
}