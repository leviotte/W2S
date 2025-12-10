'use server';

import 'server-only';
import type { SessionOptions } from 'iron-session'; 
import type { UserProfile } from '@/types/user';

// Dit is nu de ENIGE bron van waarheid voor de structuur van onze sessie.
declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: string; // Firebase UID
      isLoggedIn: true;
    } & UserProfile; // Voegt alle velden van UserProfile toe
  }
}

// *** DE DEFINITIEVE FIX ***
// Correcte naam 'SessionOptions' en het '=' teken.
export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'wish2share-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
};

// Een robuuste check om opstartfouten te voorkomen.
if (!sessionOptions.password) {
  throw new Error('SECRET_COOKIE_PASSWORD environment variable is not set. Please add it to your .env.local file.');
}