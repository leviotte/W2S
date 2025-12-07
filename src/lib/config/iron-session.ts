// src/lib/config/iron-session.ts
import type { SessionOptions } from 'iron-session'; // Correctie: het is SessionOptions, niet IronSessionOptions
import type { UserProfile } from '@/types';

// Vergroot de sessiedata om het volledige UserProfile op te slaan
export interface SessionData {
  user?: UserProfile;
}

export const sessionOptions: SessionOptions = { // Correctie hier
  // Het wachtwoord MOET minstens 32 karakters lang zijn
  password: process.env.SESSION_SECRET as string,
  cookieName: 'wish2share-session-v2', // v2 om conflicten met oude sessies te vermijden
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

// Zorg ervoor dat je in je .env.local een sterk, 32+ karakter lang SESSION_SECRET hebt:
// SESSION_SECRET=jouw_super_geheime_wachtwoord_van_minstens_32_karakters