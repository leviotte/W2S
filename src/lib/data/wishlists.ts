// src/lib/data/wishlists.ts
import { adminDb } from '../server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import { Wishlist } from '@/types/wishlist'; // Zorg ervoor dat dit type bestaat en klopt

export type WishlistStats = {
  total: number;
  public: number;
  private: number;
};

export const getWishlistStatsForUser = cache(
  async (userId: string): Promise<WishlistStats> => {
    try {
      if (!userId) return { total: 0, public: 0, private: 0 };
      
      const wishlistsRef = adminDb.collection('wishlists');
      const q = wishlistsRef.where('ownerId', '==', userId);
      const snapshot = await q.get();

      if (snapshot.empty) {
        return { total: 0, public: 0, private: 0 };
      }

      const wishlists = snapshot.docs.map(doc => doc.data() as Wishlist);

      const publicCount = wishlists.filter(wl => !wl.isPrivate).length;
      const privateCount = wishlists.filter(wl => wl.isPrivate).length;

      return {
        total: wishlists.length,
        public: publicCount,
        private: privateCount,
      };
    } catch (error) {
      console.error(`❌ Error fetching wishlist stats for user ${userId}:`, error);
      return { total: 0, public: 0, private: 0 };
    }
  },
  ['wishlist-stats-for-user'],
  { revalidate: 1800, tags: ['wishlists', `wishlists-user-${'${userId}'}`] } // Kortere cache, wishlists veranderen vaker
);