// src/lib/server/data/user-stats.ts
import 'server-only';

import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache } from 'next/cache';
import type {
  EventStats,
  WishlistStats,
  FollowStats,
  DashboardStats,
} from '@/types/dashboard';

/* ============================================================================
 * EVENT STATS
 * ========================================================================== */

const getEventStatsCached = unstable_cache(
  async (userId: string): Promise<EventStats> => {
    if (!userId) return { upcoming: 0, past: 0, onGoing: 0, all: 0 };

    const snapshot = await adminDb
      .collection('events')
      .where(`participants.${userId}.id`, '==', userId)
      .get();

    const now = new Date();
    let upcoming = 0;
    let past = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date?.toDate?.() ?? new Date(data.date);
      date >= now ? upcoming++ : past++;
    });

    return {
      upcoming,
      past,
      onGoing: 0,
      all: snapshot.size,
    };
  },
  ['event-stats'],
  {
    revalidate: 300,
    tags: ['user-events'],
  }
);

export function getEventStatsForUser(userId: string) {
  return getEventStatsCached(userId);
}

/* ============================================================================
 * WISHLIST STATS
 * ========================================================================== */

const getWishlistStatsCached = unstable_cache(
  async (userId: string): Promise<WishlistStats> => {
    if (!userId) return { total: 0, public: 0, private: 0 };

    const ref = adminDb.collection('wishlists').where('ownerId', '==', userId);

    const [totalSnap, publicSnap] = await Promise.all([
      ref.count().get(),
      ref.where('isPublic', '==', true).count().get(),
    ]);

    const total = totalSnap.data().count ?? 0;
    const pub = publicSnap.data().count ?? 0;

    return {
      total,
      public: pub,
      private: total - pub,
    };
  },
  ['wishlist-stats'],
  {
    revalidate: 300,
    tags: ['user-wishlists'],
  }
);

export function getWishlistStatsForUser(userId: string) {
  return getWishlistStatsCached(userId);
}

/* ============================================================================
 * FOLLOW STATS
 * ========================================================================== */

const getFollowStatsCached = unstable_cache(
  async (userId: string): Promise<FollowStats> => {
    if (!userId) return { followers: 0, following: 0 };

    const [followers, following] = await Promise.all([
      adminDb.collection('followers').where('followingId', '==', userId).get(),
      adminDb.collection('followers').where('followerId', '==', userId).get(),
    ]);

    return {
      followers: followers.size,
      following: following.size,
    };
  },
  ['follow-stats'],
  {
    revalidate: 300,
    tags: ['user-follow'],
  }
);

export function getFollowStatsForUser(userId: string) {
  return getFollowStatsCached(userId);
}

/* ============================================================================
 * COMBINED DASHBOARD STATS (USE THIS IN PAGES)
 * ========================================================================== */

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [events, wishlists, follows] = await Promise.all([
    getEventStatsForUser(userId),
    getWishlistStatsForUser(userId),
    getFollowStatsForUser(userId),
  ]);

  return {
    events,
    wishlists,
    follows,
  };
}
