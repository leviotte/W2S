// src/types/user.ts
import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  box: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

export const SocialLinksSchema = z.object({
  website: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
});
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string(),
  photoURL: z.string().url().optional().nullable(),
  username: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  isPublic: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  socials: SocialLinksSchema.optional(),
  ownerId: z.string(), 
  managers: z.array(z.string()).default([]),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// DIT IS DE ENIGE JUISTE DEFINITIE VOOR DE SESSIE-COOKIE
export type SessionData = {
  uid: string;
  isLoggedIn: boolean;
};