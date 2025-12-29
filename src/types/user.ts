import { z } from 'zod';
import { addressSchema, type Address, type AddressNullable } from './address';

/** Firestore-Timestamp → Date */
const timestampSchema = z.preprocess(arg => {
  if (arg && typeof arg === 'object' && 'toDate' in arg && typeof arg.toDate === 'function') return arg.toDate();
  if (arg instanceof Date || typeof arg === 'string' || typeof arg === 'number') {
    const d = new Date(arg);
    if (!isNaN(d.getTime())) return d;
  }
  return arg;
}, z.date());

export const socialLinksSchema = z.object({
  website: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin: z.string().url().or(z.literal('')).optional().nullable(),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const baseProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().optional(),
  photoURL: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

export const userProfileSchema = baseProfileSchema.extend({
  email: z.string().email(),
  username: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: addressSchema,
  isPublic: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  createdAt: timestampSchema.default(() => new Date()),
  updatedAt: timestampSchema.default(() => new Date()),
  socials: socialLinksSchema.nullable().optional(),
});

export const subProfileSchema = baseProfileSchema;

export const sessionUserSchema = z.object({
  id: z.string(),
  isLoggedIn: z.literal(true),
  email: z.string().email(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoURL: z.string().nullable().optional(),
  isAdmin: z.boolean().default(false),
  isPartner: z.boolean().default(false),
  username: z.string().optional().nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type SubProfile = z.infer<typeof subProfileSchema>;
export type AnyProfile = UserProfile | SubProfile;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type { Address, AddressNullable };
export type UserRole = 'user' | 'admin' | 'partner' | 'organizer';

/** 👤 Auth types */
export type AuthedUser = { isLoggedIn: true; id: string; email: string; profile: UserProfile & { id: string } };
export type GuestUser = { isLoggedIn: false };
export type AnyUser = AuthedUser | GuestUser;

/** 🛡 Type guards */
export function isUserProfile(profile: AnyProfile): profile is UserProfile { return 'email' in profile; }
export function isSubProfile(profile: AnyProfile): profile is SubProfile { return !('email' in profile); }
export function isAuthenticated(user: AnyUser): user is AuthedUser { return user.isLoggedIn === true; }
export function isGuest(user: AnyUser): user is GuestUser { return user.isLoggedIn === false; }

/** 🛠 Helpers */
export function generateDisplayName(firstName: string, lastName: string) { return `${firstName.trim()} ${lastName.trim()}`.trim(); }
export function getInitials(displayName: string) { return displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
export function hasPhoto(profile: AnyProfile) { return !!profile.photoURL; }
export function getPhotoURL(profile: AnyProfile, fallback?: string) { return profile.photoURL || fallback || '/default-avatar.png'; }
export function getUserNames(user: SessionUser) {
  const firstName = user.firstName ?? user.displayName.split(' ')[0] ?? '';
  const lastName = user.lastName ?? user.displayName.split(' ').slice(1).join(' ') ?? '';
  return { firstName, lastName };
}

/** 🔍 Validation */
export function validateUserProfile(data: unknown): UserProfile { return userProfileSchema.parse(data); }
export function validateSubProfile(data: unknown): SubProfile { return subProfileSchema.parse(data); }
export function safeValidateUserProfile(data: unknown) { return userProfileSchema.safeParse(data); }
export function safeValidateSubProfile(data: unknown) { return subProfileSchema.safeParse(data); }

/** 🗄 Firestore converters */
export const userProfileConverter = {
  toFirestore: (profile: UserProfile) => { const data = { ...profile }; Object.keys(data).forEach(k => data[k as keyof UserProfile] === undefined && delete data[k as keyof UserProfile]); return data; },
  fromFirestore: (snapshot: any) => userProfileSchema.parse({ ...snapshot.data(), id: snapshot.id }),
};
export const subProfileConverter = {
  toFirestore: (profile: SubProfile) => { const data = { ...profile }; Object.keys(data).forEach(k => data[k as keyof SubProfile] === undefined && delete data[k as keyof SubProfile]); return data; },
  fromFirestore: (snapshot: any) => subProfileSchema.parse({ ...snapshot.data(), id: snapshot.id }),
};

/** 🔑 Roles & Search */
export type SearchResult = { id: string; displayName: string; firstName: string; lastName: string; username?: string | null; photoURL?: string | null; city?: string | null; gender?: string | null; age?: number; type: 'user' | 'profile'; };
export function getUserRole(user: UserProfile | null): UserRole {
  if (!user) return 'user';
  if (user.isAdmin) return 'admin';
  if (user.isPartner) return 'partner';
  return 'user';
}
export function hasRole(user: UserProfile | null, role: UserRole) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return getUserRole(user) === role;
}
export function isAdminUser(user: UserProfile | null) { return user?.isAdmin === true; }
export function isPartnerUser(user: UserProfile | null) { return user?.isPartner === true; }

export { addressSchema };
