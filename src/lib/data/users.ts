// src/lib/data/users.ts
import { adminDb } from '../server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';

// Type definitie voor duidelijkheid, kan ook worden gebruikt door client componenten
export type FollowStats = {
  followers: number;
  following: number;
};

// Server-side functie om volgers en volgend-aantallen op te halen
export const getFollowCounts = cache(
  async (userId: string): Promise<FollowStats> => {
    try {
      if (!userId) return { followers: 0, following: 0 };

      // We halen de tellingen parallel op voor maximale performance
      const [followersSnapshot, followingSnapshot] = await Promise.all([
        adminDb.collection('users').doc(userId).collection('followers').count().get(),
        adminDb.collection('users').doc(userId).collection('following').count().get(),
      ]);

      return {
        followers: followersSnapshot.data().count,
        following: followingSnapshot.data().count,
      };
    } catch (error) {
      console.error(`❌ Error fetching follow counts for user ${userId}:`, error);
      return { followers: 0, following: 0 };
    }
  },
  ['follow-counts-for-user'],
  { revalidate: 3600, tags: ['follows', `follows-user-${'${userId}'}`] }
);