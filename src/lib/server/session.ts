// src/lib/server/session.ts
import type { SessionOptions } from 'iron-session';
import type { AuthedUser } from '@/types/user';

// Dit is het contract voor onze sessie.
export interface SessionData {
  user?: AuthedUser;
  // We laten 'isLoggedIn' bewust weg. De aanwezigheid van 'user' is de enige bron van waarheid.
}

export const sessionOptions: SessionOptions = {
  // Zorg ervoor dat dit wachtwoord in je .env.local staat en MINSTENS 32 karakters lang is.
  // Gebruik `openssl rand -base64 32` in je terminal om een sterk wachtwoord te genereren.
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: 'wish2share-session',
  cookieOptions: {
    // secure: true in productie betekent dat de cookie alleen via HTTPS wordt verstuurd.
    // Dit is essentieel voor de veiligheid. Voor lokaal (http://localhost) moet dit false zijn.
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Cruciaal! Voorkomt dat client-side JS de cookie kan lezen.
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
  },
};

// BELANGRIJK: Voeg IRON_SESSION_PASSWORD toe aan je .env.local bestand!
// Voorbeeld: IRON_SESSION_PASSWORD="jouw_super_geheime_sterke_wachtwoord_hier"