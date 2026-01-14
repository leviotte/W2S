// src/lib/server/actions/user-actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { userProfileSchema, type UserProfile, generateDisplayName } from '@/types/user';
import { Timestamp } from 'firebase-admin/firestore';
import { getSession } from '@/lib/auth/session.server';


export async function getUserProfileAction(userId: string): Promise<(UserProfile & { id: string }) | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('getUserProfileAction: No document found for userId:', userId);
      return null;
    }

    const data = userDoc.data();
    if (!data) {
      console.error('getUserProfileAction: Document exists but data is empty for userId:', userId);
      return null;
    }

    // FIX: Converteer Timestamps en zorg dat alle vereiste velden aanwezig zijn.
    const profileData = {
  ...data,
  id: userId,
  userId,
  displayName: data.displayName ?? generateDisplayName(data.firstName, data.lastName),
  createdAt:
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
  updatedAt:
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : new Date(data.updatedAt),
};

    const validation = userProfileSchema.safeParse(profileData);

    if (!validation.success) {
      console.error('User profile validation failed for UID:', userId, validation.error.flatten());
      return null;
    }

    return validation.data as UserProfile & { id: string };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
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
    // 👉 Bestaat al → valideren & teruggeven
    const existingProfile = await getUserProfileAction(uid);
    if (!existingProfile) {
      throw new Error('Existing user profile is invalid');
    }
    return existingProfile;
  }

  // 👉 Bestaat niet → aanmaken
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
export async function getCurrentUserProfileFromSession(): Promise<(UserProfile & { id: string }) | null> {
  const { user } = await getSession();
  if (!user?.id || !user.isLoggedIn) return null;
  return getUserProfileAction(user.id);
}