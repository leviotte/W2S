// src/lib/server/actions/wishlist-read.ts
'use server';

import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import type { Wishlist } from '@/types/wishlist';

export async function getWishlistBySlugAction(
  slug: string
): Promise<{ success: true; data: Wishlist } | { success: false }> {
  const snapshot = await adminDb
    .collection('wishlists')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { success: false };
  }

  const doc = snapshot.docs[0];

  return {
    success: true,
    data: {
      id: doc.id,
      ...(doc.data() as Omit<Wishlist, 'id'>),
    },
  };
}
