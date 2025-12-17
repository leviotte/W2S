'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { SubProfile } from '@/types/sub-profile';

export async function getSubProfileById(
  profileId: string
): Promise<SubProfile | null> {
  const doc = await adminDb.collection('profiles').doc(profileId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    userId: data.userId,

    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName,
    displayName_lowercase: data.displayName_lowercase,

    photoURL: data.photoURL ?? null,
    birthdate: data.birthdate ?? null,
    gender: data.gender ?? null,

    isPublic: data.isPublic ?? false,

    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}
