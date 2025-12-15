// src/lib/server/actions/user-actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { userProfileSchema, type UserProfile } from '@/types/user';

/**
 * Haal user profile op via userId
 */
export async function getUserProfileAction(userId: string): Promise<(UserProfile & { id: string }) | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const validation = userProfileSchema.safeParse({
      ...userDoc.data(),
      id: userId,
    });

    if (!validation.success) {
      console.error('User profile validation failed:', validation.error);
      return null;
    }

    return validation.data as UserProfile & { id: string };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}