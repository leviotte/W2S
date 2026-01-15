// src/lib/server/actions/user-actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { userProfileSchema, type UserProfile, generateDisplayName } from '@/types/user';
import { Timestamp } from 'firebase-admin/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export type AuthUser = {
  id: string;
  role: string;
  email: string;
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  isAdmin?: boolean;
};

/**
 * Haal een user profile op vanuit Firestore.
 * Retourneert null als er geen profile bestaat of validatie faalt.
 */
export async function getUserProfileAction(
  userId: string
): Promise<(UserProfile & { id: string }) | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('getUserProfileAction: No document found for userId:', userId);
      return null;
    }

    const data = userDoc.data() ?? {};

    // Bouw een volledig UserProfile object met alle vereiste velden
    const profileData: UserProfile & { id: string } = {
      id: userId,
      userId,
      email: data.email ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      displayName: data.displayName ?? generateDisplayName(data.firstName, data.lastName),
      photoURL: data.photoURL ?? null,
      address: {
        street: data.address?.street ?? '',
        number: data.address?.number ?? '',
        box: data.address?.box ?? '',
        postalCode: data.address?.postalCode ?? '',
        city: data.address?.city ?? '',
        country: data.address?.country ?? '',
      },
      isPublic: data.isPublic ?? false,
      isAdmin: data.isAdmin ?? false,
      isPartner: data.isPartner ?? false,
      sharedWith: data.sharedWith ?? [],
      socials: data.socials ?? null,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now()),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt ?? Date.now()),
      birthdate: data.birthdate ?? null,
      gender: data.gender ?? null,
      username: data.username ?? null,
      phone: data.phone ?? null,
    };

    const validation = userProfileSchema.safeParse(profileData);

    if (!validation.success) {
      console.error(
        'getUserProfileAction: User profile validation failed for UID:',
        userId,
        validation.error.flatten()
      );
      return null;
    }

    return validation.data;
  } catch (error) {
    console.error('getUserProfileAction: Error fetching user profile:', error);
    return null;
  }
}

/**
 * Zorg dat een user profile bestaat. Creëer een nieuw profiel als het nog niet bestaat.
 */
export async function ensureUserProfileAction(input: {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<UserProfile & { id: string }> {
  const { uid, email, displayName, photoURL } = input;

  if (!email) {
    throw new Error('ensureUserProfileAction: email is required');
  }

  const userRef = adminDb.collection('users').doc(uid);
  const existingDoc = await userRef.get();

  if (existingDoc.exists) {
    const existingProfile = await getUserProfileAction(uid);
    if (!existingProfile) {
      throw new Error('Existing user profile is invalid');
    }
    return existingProfile;
  }

  const now = new Date();

  const newProfile: UserProfile & { id: string } = {
    id: uid,
    userId: uid,
    email,
    firstName: displayName?.split(' ')[0] || email.split('@')[0],
    lastName: displayName?.split(' ').slice(1).join(' ') || '',
    displayName: displayName || email.split('@')[0],
    photoURL: photoURL ?? null,
    address: {
      street: '',
      number: '',
      box: '',
      postalCode: '',
      city: '',
      country: '',
    },
    isPublic: false,
    isAdmin: false,
    isPartner: false,
    sharedWith: [],
    socials: null,
    createdAt: now,
    updatedAt: now,
    birthdate: null,
    gender: null,
    username: null,
    phone: null,
  };

  const validation = userProfileSchema.safeParse(newProfile);

  if (!validation.success) {
    console.error(
      'ensureUserProfileAction: validation failed',
      validation.error.flatten()
    );
    throw new Error('New user profile validation failed');
  }

  await userRef.set(validation.data);

  return validation.data;
}

/**
 * Haal het huidige ingelogde user profile op vanuit NextAuth sessie.
 */
export async function getCurrentUserProfileFromSession(): Promise<(UserProfile & { id: string }) | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  return getUserProfileAction(session.user.id);
}

/**
 * Haal een user op via email (gebruikt bij CredentialsProvider).
 */
export async function getUserByEmail(email: string): Promise<{
  id: string;
  role: string;
  name: string;
  email: string;
  password: string;
} | null> {
  const snapshot = await adminDb.collection('users').where('email', '==', email).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data() as any;

  return {
    id: doc.id,
    role: data.role || 'user',
    name: data.displayName || `${data.firstName} ${data.lastName}`,
    email: data.email,
    password: data.password,
  };
}

/**
 * Require een ingelogde user vanuit NextAuth, TS-proof.
 */
export async function requireAuthUser(): Promise<UserProfile & { id: string }> {
  const user = await getCurrentUserProfileFromSession();
  if (!user) throw new Error('Authenticatie vereist');
  return user;
}

/**
 * Require een admin user vanuit NextAuth, TS-proof.
 */
export async function requireAdminUser(): Promise<AuthUser> {
  const userProfile = await requireAuthUser();

  if (!userProfile.isAdmin) throw new Error('Admin rechten vereist');

  // Map UserProfile naar AuthUser
  const authUser: AuthUser = {
    id: userProfile.id,
    role: 'admin', // of gebruik userProfile.role als je dat opslaat
    email: userProfile.email,
    name: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
    displayName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    photoURL: userProfile.photoURL ?? null,
    isAdmin: userProfile.isAdmin,
  };

  return authUser;
}
