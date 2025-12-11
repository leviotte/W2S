import 'server-only';

import { cache } from 'react';
import { adminDb } from '@/lib/server/firebase-admin';
import type { SocialMediaAccounts } from '@/types/social-media';

// ============================================================================
// GET SOCIAL MEDIA ACCOUNTS
// ============================================================================

export const getSocialMediaAccounts = cache(
  async (): Promise<SocialMediaAccounts | null> => {
    try {
      const snapshot = await adminDb
        .collection('accounts')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        twitter: data.twitter || null,
        tiktok: data.tiktok || null,
        pinterest: data.pinterest || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        author: data.author,
      };
    } catch (error) {
      console.error('Error fetching social media accounts:', error);
      return null;
    }
  }
);

// ============================================================================
// CACHED VERSION (5 minutes)
// ============================================================================

export async function getCachedSocialMediaAccounts(): Promise<SocialMediaAccounts | null> {
  return getSocialMediaAccounts();
}