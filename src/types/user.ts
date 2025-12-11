// src/types/user.ts

import { z } from "zod";

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

/**
 * Helper schema voor Firestore Timestamps.
 * Converteert Firestore Timestamp objecten naar JavaScript Date objecten.
 */
const timestampSchema = z.preprocess((arg) => {
  // Firestore Timestamp object
  if (arg && typeof arg === 'object' && 'toDate' in arg && typeof arg.toDate === 'function') {
    return arg.toDate();
  }
  // ISO string, timestamp number, of Date object
  if (arg instanceof Date || typeof arg === 'string' || typeof arg === 'number') {
    const d = new Date(arg);
    if (!isNaN(d.getTime())) return d;
  }
  return arg;
}, z.date());

/**
 * Adres schema - optionele velden voor flexibiliteit
 */
export const addressSchema = z.object({
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  box: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
}).default({}).nullable();

/**
 * Social media links schema - alle velden optioneel
 */
export const socialLinksSchema = z.object({
  website: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
}).default({}).nullable();

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

/**
 * Base profile schema - velden die ALLE profielen delen
 * Gebruikt Firebase naming conventions (photoURL ipv avatarUrl)
 */
export const baseProfileSchema = z.object({
  id: z.string(),
  userId: z.string(), // Firebase UID van de eigenaar/hoofdaccount
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  displayName: z.string().min(2, "Weergavenaam is te kort"),
  photoURL: z.string().url("Ongeldige URL").optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

/**
 * Hoofdprofiel (UserProfile) - gekoppeld aan Firebase Auth
 * Bevat email, admin rechten, en volledige gebruikersgegevens
 */
export const userProfileSchema = baseProfileSchema.extend({
  email: z.string().email("Ongeldig e-mailadres"),
  phone: z.string().optional().nullable(),
  address: addressSchema,
  isPublic: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  socials: socialLinksSchema,
});

/**
 * Subprofiel (SubProfile) - GEEN eigen login
 * Bijvoorbeeld voor kinderen, partners, of andere gezinsleden
 * Erft automatisch photoURL van baseProfileSchema
 */
export const subProfileSchema = baseProfileSchema.extend({
  parentId: z.string().optional(), // Link naar het hoofd UserProfile
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type UserProfile = z.infer<typeof userProfileSchema>;
export type SubProfile = z.infer<typeof subProfileSchema>;
export type AnyProfile = UserProfile | SubProfile;
export type Address = z.infer<typeof addressSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;

// ============================================================================
// TYPE GUARDS (voor type narrowing)
// ============================================================================

/**
 * Type guard: Check of een profiel een UserProfile is
 * @param profile - Een UserProfile of SubProfile
 * @returns true als het een UserProfile is (heeft email property)
 */
export function isUserProfile(profile: AnyProfile): profile is UserProfile {
  return 'email' in profile;
}

/**
 * Type guard: Check of een profiel een SubProfile is
 * @param profile - Een UserProfile of SubProfile
 * @returns true als het een SubProfile is (geen email property)
 */
export function isSubProfile(profile: AnyProfile): profile is SubProfile {
  return !('email' in profile);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Genereert een display name uit voor- en achternaam
 */
export function generateDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/**
 * Genereert initialen uit een display name
 * @example "Levi Otte" -> "LO"
 */
export function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check of een profiel een foto heeft
 */
export function hasPhoto(profile: AnyProfile): boolean {
  return !!profile.photoURL;
}

/**
 * Verkrijg de foto URL of een fallback
 */
export function getPhotoURL(profile: AnyProfile, fallback?: string): string {
  return profile.photoURL || fallback || '/default-avatar.png';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valideer een UserProfile object
 * @throws ZodError als validatie faalt
 */
export function validateUserProfile(data: unknown): UserProfile {
  return userProfileSchema.parse(data);
}

/**
 * Valideer een SubProfile object
 * @throws ZodError als validatie faalt
 */
export function validateSubProfile(data: unknown): SubProfile {
  return subProfileSchema.parse(data);
}

/**
 * Safe validation - returned success boolean + data of errors
 */
export function safeValidateUserProfile(data: unknown) {
  return userProfileSchema.safeParse(data);
}

export function safeValidateSubProfile(data: unknown) {
  return subProfileSchema.safeParse(data);
}
// ============================================================================
// SESSION & AUTH TYPES
// ============================================================================

/**
 * SessionUser - Minimale data die we in iron-session opslaan
 * BEST PRACTICE: Sla alleen essentiële velden op, niet hele profile
 */
export const sessionUserSchema = z.object({
  id: z.string(), // Firebase UID
  isLoggedIn: z.literal(true),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().nullable().optional(),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

/**
 * AuthedUser - Volledige authenticated user voor gebruik in components
 * Combineert session data met volledige profile uit Firestore
 */
export type AuthedUser = {
  isLoggedIn: true;
  id: string;
  email: string;
  profile: UserProfile & { id: string };
};

/**
 * Guest user - Voor niet-ingelogde gebruikers
 */
export type GuestUser = {
  isLoggedIn: false;
};

/**
 * AnyUser - Union type voor alle user states
 */
export type AnyUser = AuthedUser | GuestUser;

// ============================================================================
// SESSION TYPE GUARDS
// ============================================================================

/**
 * Check of een user ingelogd is (type guard)
 */
export function isAuthenticated(user: AnyUser): user is AuthedUser {
  return user.isLoggedIn === true;
}

/**
 * Check of een user een guest is (type guard)
 */
export function isGuest(user: AnyUser): user is