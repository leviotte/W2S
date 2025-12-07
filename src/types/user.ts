// src/types/user.ts
import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  box: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

// CORE FIX: Changed 'uid' back to 'id' to solve dozens of errors.
export const userProfileSchema = z.object({
  id: z.string(), // WAS 'uid'
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string().optional(),
  // CORE FIX: Add 'name' to handle sub-profile logic gracefully
  name: z.string().optional(),
  photoURL: z.string().url().nullable().optional(),
  // CORE FIX: Add 'avatarURL' for compatibility with old logic
  avatarURL: z.string().url().nullable().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  isPublic: z.boolean().default(true), 
  isAdmin: z.boolean().default(false),
});

export const subProfileSchema = userProfileSchema.extend({
  name: z.string(), // 'name' is required for sub-profiles
  managers: z.array(z.string()).default([]), 
});

export type Address = z.infer<typeof addressSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type SubProfile = z.infer<typeof subProfileSchema>;
export type Manager = UserProfile;

// This type represents the user currently logged into the session
export type AuthedUser = {
  id: string; // The user's main ID
  email?: string | null;
  isLoggedIn: true;
  // The profile they are currently acting as (can be main or sub-profile)
  profile: UserProfile | SubProfile; 
};

export type SessionData = {
  user?: AuthedUser;
  isLoggedIn: boolean;
};