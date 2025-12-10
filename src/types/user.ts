import { z } from "zod";

// Helper schema voor Firestore Timestamps
const timestampSchema = z.preprocess((arg) => {
  if (arg && typeof arg === 'object' && 'toDate' in arg && typeof arg.toDate === 'function') {
    return arg.toDate();
  }
  if (arg instanceof Date || typeof arg === 'string') {
    return new Date(arg);
  }
  return arg;
}, z.date());

export const AddressSchema = z.object({
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  box: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
}).default({});

export const UserSocialsSchema = z.object({
  website: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
}).default({});

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email("Ongeldig e-mailadres"),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  displayName: z.string().min(2, "Weergavenaam is te kort"),
  photoURL: z.string().url("Ongeldige URL voor profielfoto").optional().nullable(),
  username: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: AddressSchema.optional(),
  isPublic: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  ownerId: z.string().optional(), 
  managers: z.array(z.string()).default([]),
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  socials: UserSocialsSchema.optional(), // Maak socials optioneel voor bestaande profielen
});

// --- DE FIX ---
// Alias voor backward compatibility tijdens de migratie.
export const SessionUserSchema = UserProfileSchema;

// TypeScript types
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserSocials = z.infer<typeof UserSocialsSchema>;
export type Address = z.infer<typeof AddressSchema>;

// Dit type bootst de oude datastructuur na die de client componenten verwachten.
// Het bevat een genest 'profile' object.
export type AuthedUser = {
  isLoggedIn: true;
  id: string;
  email: string;
  profile: UserProfile;
};