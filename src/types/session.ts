// src/types/session.ts
import { z } from 'zod';

// Ingelogde gebruiker - volledige session user schema
export const sessionUserSchema = z.object({
  isLoggedIn: z.literal(true),
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoURL: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  isAdmin: z.boolean().optional().default(false),
  isPartner: z.boolean().optional().default(false),
  createdAt: z.number().optional(),
  lastActivity: z.number().optional(),
});

// Uitgelogde (anonieme) gebruiker
export const anonymousSessionUserSchema = z.object({
  isLoggedIn: z.literal(false),
});

// Types - 100% TS-strict, compatible met Next.js 16
export type AuthenticatedSessionUser = z.infer<typeof sessionUserSchema>;
export type AnonymousSessionUser = z.infer<typeof anonymousSessionUserSchema>;
export type SessionUser = AuthenticatedSessionUser | AnonymousSessionUser;
export type Session = { user: SessionUser };

// Type guards / helpers
export function isAuthenticated(user: SessionUser): user is AuthenticatedSessionUser {
  return user.isLoggedIn === true;
}
export function isGuest(user: SessionUser): user is AnonymousSessionUser {
  return user.isLoggedIn === false;
}
