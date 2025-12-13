import { z } from 'zod';
import { addressSchema, type Address, type AddressNullable } from './address';

/**
 * Timestamp Schema - Handles Firestore Timestamps
 */
const timestampSchema = z.preprocess((arg) => {
  // Firestore Timestamp object
  if (arg && typeof arg === 'object' && 'toDate' in arg && typeof arg.toDate === 'function') {
    return arg.toDate();
  }
  // Date, string, or number
  if (arg instanceof Date || typeof arg === 'string' || typeof arg === 'number') {
    const d = new Date(arg);
    if (!isNaN(d.getTime())) return d;
  }
  return arg;
}, z.date());

/**
 * Social Links Schema
 */
export const socialLinksSchema = z.object({
  website: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
});

export type SocialLinks = z.infer<typeof socialLinksSchema>;

/**
 * Base Profile Schema (shared between User & SubProfiles)
 */
export const baseProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string().min(1, 'Voornaam is verplicht'),
  lastName: z.string().min(1, 'Achternaam is verplicht'),
  displayName: z.string().min(2, 'Weergavenaam is te kort'),
  photoURL: z.string().url('Ongeldige URL').optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

/**
 * User Profile Schema (main user account)
 */
export const userProfileSchema = baseProfileSchema.extend({
  email: z.string().email('Ongeldig e-mailadres'),
  username: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: addressSchema,
  
  // Permissions & Flags
  isPublic: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  
  // Sharing
  sharedWith: z.array(z.string()).optional().default([]),
  
  // Timestamps
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  
  // Social Links
  socials: socialLinksSchema.nullable().optional(),
});

/**
 * Sub Profile Schema (for kids, pets, etc.)
 */
export const subProfileSchema = baseProfileSchema.extend({
  parentId: z.string().optional(),
});

/**
 * Session User Schema (lightweight for iron-session)
 */
export const sessionUserSchema = z.object({
  id: z.string(),
  isLoggedIn: z.literal(true),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().nullable().optional(),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  username: z.string().optional().nullable(),
});

// ============================================
// EXPORTED TYPES
// ============================================

export type UserProfile = z.infer<typeof userProfileSchema>;
export type SubProfile = z.infer<typeof subProfileSchema>;
export type AnyProfile = UserProfile | SubProfile;
export type SessionUser = z.infer<typeof sessionUserSchema>;

export type { Address, AddressNullable };

// ============================================
// USER ROLE TYPES
// ============================================

export type UserRole = 'user' | 'admin' | 'partner' | 'organizer';

// ============================================
// AUTHED vs GUEST USER (voor iron-session)
// ============================================

export type AuthedUser = {
  isLoggedIn: true;
  id: string;
  email: string;
  profile: UserProfile & { id: string };
};

export type GuestUser = {
  isLoggedIn: false;
};

export type AnyUser = AuthedUser | GuestUser;

// ============================================
// TYPE GUARDS
// ============================================

export function isUserProfile(profile: AnyProfile): profile is UserProfile {
  return 'email' in profile;
}

export function isSubProfile(profile: AnyProfile): profile is SubProfile {
  return !('email' in profile);
}

export function isAuthenticated(user: AnyUser): user is AuthedUser {
  return user.isLoggedIn === true;
}

export function isGuest(user: AnyUser): user is GuestUser {
  return user.isLoggedIn === false;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function generateDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function hasPhoto(profile: AnyProfile): boolean {
  return !!profile.photoURL;
}

export function getPhotoURL(profile: AnyProfile, fallback?: string): string {
  return profile.photoURL || fallback || '/default-avatar.png';
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export function validateUserProfile(data: unknown): UserProfile {
  return userProfileSchema.parse(data);
}

export function validateSubProfile(data: unknown): SubProfile {
  return subProfileSchema.parse(data);
}

export function safeValidateUserProfile(data: unknown) {
  return userProfileSchema.safeParse(data);
}

export function safeValidateSubProfile(data: unknown) {
  return subProfileSchema.safeParse(data);
}

// ============================================
// FIRESTORE CONVERTERS
// ============================================

export const userProfileConverter = {
  toFirestore: (profile: UserProfile) => {
    const data: any = { ...profile };
    // Remove undefined values
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });
    return data;
  },
  fromFirestore: (snapshot: any): UserProfile => {
    const data = snapshot.data();
    return userProfileSchema.parse({
      ...data,
      id: snapshot.id,
    });
  },
};

export const subProfileConverter = {
  toFirestore: (profile: SubProfile) => {
    const data: any = { ...profile };
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });
    return data;
  },
  fromFirestore: (snapshot: any): SubProfile => {
    const data = snapshot.data();
    return subProfileSchema.parse({
      ...data,
      id: snapshot.id,
    });
  },
};

// ============================================
// ROLE HELPERS
// ============================================

export function getUserRole(user: UserProfile | null): UserRole {
  if (!user) return 'user';
  if (user.isAdmin) return 'admin';
  if (user.isPartner) return 'partner';
  return 'user';
}

export function hasRole(user: UserProfile | null, role: UserRole): boolean {
  if (!user) return false;
  const userRole = getUserRole(user);
  
  // Admin has all permissions
  if (userRole === 'admin') return true;
  
  return userRole === role;
}

export function isAdminUser(user: UserProfile | null): boolean {
  return user?.isAdmin === true;
}

export function isPartnerUser(user: UserProfile | null): boolean {
  return user?.isPartner === true;
}

// ============================================
// EXPORTS
// ============================================

export { addressSchema };