// src/lib/server/actions/wishlist-owner.ts
'use server';

import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';

export async function getWishlistOwnerAction(
  userId: string
): Promise<{ success: true; data: UserProfile } | { success: false }> {
  const doc = await adminDb.collection('users').doc(userId).get();

  if (!doc.exists) {
    return { success: false };
  }

  return {
    success: true,
    data: {
      id: doc.id,
      ...(doc.data() as Omit<UserProfile, 'id'>),
    },
  };
}
