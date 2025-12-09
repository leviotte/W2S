// src/types/user.ts
import { z } from 'zod';

// Base Address Schema, herbruikbaar
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).nullable();

export type Address = z.infer<typeof AddressSchema>;

// Main User Profile Schema (data in 'users' or 'profiles' collection)
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(), // Often `${firstName} ${lastName}`
  username: z.string().optional(),
  photoURL: z.string().url().nullable().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: AddressSchema,
  isPublic: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
  managers: z.array(z.string()).default([]), // Array of user IDs
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Sub-profile is essentially a UserProfile with a userId pointing to the owner
export const SubProfileSchema = UserProfileSchema.extend({
  userId: z.string(), // The ID of the main account that owns this profile
});

export type SubProfile = z.infer<typeof SubProfileSchema>;

// Manager type for clarity in components
export const ManagerSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoURL: z.string().url().nullable().optional(),
});

export type Manager = z.infer<typeof ManagerSchema>;

// Dit is de belangrijkste: de structuur van onze Iron Session!
export const AuthedUserSchema = z.object({
  profile: UserProfileSchema,
  // Hier kunnen we later extra sessie-specifieke data toevoegen,
  // bv. activeProfileId, login-tijd, etc.
});

export type AuthedUser = z.infer<typeof AuthedUserSchema>;