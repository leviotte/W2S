'use server';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { EventStats, WishlistStats, FollowStats } from '@/types/dashboard';

/**
 * Haalt event counts op voor een user
 */
export const getEventStatsForUser = cache(async (userId: string): Promise<EventStats> => {
  if (!userId) return { upcoming: 0, past: 0, onGoing: 0, all: 0 };

  try {
    const eventsSnapshot = await adminDb
      .collection('events')
      .where(`participants.${userId}.id`, '==', userId)
      .get();

    const now = new Date();
    let upcoming = 0;
    let past = 0;

    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = data.date?.toDate?.() || new Date(data.date);
      if (eventDate >= now) upcoming++;
      else past++;
    });

    return {
      upcoming,
      past,
      onGoing: 0,
      all: eventsSnapshot.size,
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return { upcoming: 0, past: 0, onGoing: 0, all: 0 };
  }
}, ['event-stats-for-user', userId], { revalidate: 300, tags: [`user-events:${userId}`] });

/**
 * Haalt wishlist counts op voor een user (met caching)
 */
export const getWishlistStatsForUser = cache(async (userId: string): Promise<WishlistStats> => {
  if (!userId) return { total: 0, public: 0, private: 0 };

  try {
    const wishlistsRef = adminDb.collection('wishlists').where('ownerId', '==', userId);

    const [totalSnapshot, publicSnapshot] = await Promise.all([
      wishlistsRef.count().get(),
      wishlistsRef.where('isPublic', '==', true).count().get(),
    ]);

    const total = totalSnapshot.data().count ?? 0;
    const publicCount = publicSnapshot.data().count ?? 0;

    return {
      total,
      public: publicCount,
      private: total - publicCount,
    };
  } catch (error) {
    console.error(`Error fetching wishlist stats for user ${userId}:`, error);
    return { total: 0, public: 0, private: 0 };
  }
}, ['wishlist-stats-for-user', userId], { revalidate: 300, tags: [`user-wishlists:${userId}`] });

/**
 * Haalt follower/following counts op
 */
export const getFollowStatsForUser = cache(async (userId: string): Promise<FollowStats> => {
  if (!userId) return { followers: 0, following: 0 };

  try {
    const [followersSnapshot, followingSnapshot] = await Promise.all([
      adminDb.collection('followers').where('followingId', '==', userId).get(),
      adminDb.collection('followers').where('followerId', '==', userId).get(),
    ]);

    return {
      followers: followersSnapshot.size,
      following: followingSnapshot.size,
    };
  } catch (error) {
    console.error('Error fetching follow stats:', error);
    return { followers: 0, following: 0 };
  }
}, ['follow-stats-for-user', userId], { revalidate: 300, tags: [`user-follow:${userId}`] });
