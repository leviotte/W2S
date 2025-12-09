// src/types/user.ts

import { z } from 'zod';

// Schema voor een adres, kan optioneel zijn
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).nullable();

export type Address = z.infer<typeof AddressSchema>;

// Basis-schema voor een profiel (zowel hoofdprofiel als subprofiel)
const ProfileBaseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  photoURL: z.string().url().nullable().optional(),
  isPublic: z.boolean().default(false),
  managers: z.array(z.string()).default([]),
  ownerId: z.string(), // ID van de hoofdgebruiker die eigenaar is
});

// Schema voor een SubProfiel
export const UserProfileSchema = ProfileBaseSchema.extend({
  // Specifieke velden voor subprofielen indien nodig
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Schema voor de hoofdgebruiker (Sessie-gebruiker)
export const SessionUserSchema = ProfileBaseSchema.extend({
  email: z.string().email(),
  isAdmin: z.boolean().default(false),
  // firstName en lastName zijn optioneel in het hoofdprofiel
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: AddressSchema.optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

// Type voor een manager, zoals gebruikt in de UI
export type Manager = {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
};