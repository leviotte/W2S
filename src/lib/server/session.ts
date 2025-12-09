// src/lib/server/session.ts
import { SessionOptions } from 'iron-session';
import type { User } from '@/types/user'; // We importeren ons nieuwe, eenduidige User type

/**
 * Dit is de blauwdruk van onze sessie-cookie.
 * We slaan de volledige, ingelogde gebruiker op, of niets.
 */
export interface SessionData {
  user?: User;
}

export const sessionOptions: SessionOptions = {
  // Zorg dat SECRET_COOKIE_PASSWORD in je .env.local staat en minstens 32 karakters lang is.
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'wish2share-session',
  cookieOptions: {
    // secure: true in productie betekent dat de cookie enkel via HTTPS verstuurd wordt.
    secure: process.env.NODE_ENV === 'production',
    // httpOnly: true betekent dat de cookie niet toegankelijk is via client-side JavaScript.
    httpOnly: true,
  },
};