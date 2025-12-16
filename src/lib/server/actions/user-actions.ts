// src/lib/server/actions/user-actions.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { userProfileSchema, type UserProfile, generateDisplayName } from '@/types/user';

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
      userId: userId, // Zorg dat userId altijd ingesteld is.
      displayName: data.displayName || generateDisplayName(data.firstName, data.lastName), // Genereer displayName als het ontbreekt.
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
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