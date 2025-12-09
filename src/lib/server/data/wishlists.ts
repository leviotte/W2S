// src/lib/server/data/wishlists.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import { WishlistSchema } from '@/types/wishlist'; // We gebruiken het Zod schema voor consistentie

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
      
      // Bouw de queries voor elke telling
      const allQuery = wishlistsRef.where('ownerId', '==', userId);
      // Let op: we gebruiken 'isPublic' zoals in ons WishlistSchema!
      const publicQuery = allQuery.where('isPublic', '==', true);
      const privateQuery = allQuery.where('isPublic', '==', false);

      // Voer alle .count() queries parallel uit voor maximale snelheid.
      // Dit is veel sneller en goedkoper dan alle documenten ophalen.
      const [
        totalSnapshot,
        publicSnapshot,
        privateSnapshot,
      ] = await Promise.all([
        allQuery.count().get(),
        publicQuery.count().get(),
        privateQuery.count().get(),
      ]);

      return {
        total: totalSnapshot.data().count,
        public: publicSnapshot.data().count,
        private: privateSnapshot.data().count,
      };
    } catch (error) {
      console.error(`❌ Error fetching wishlist stats for user ${userId}:`, error);
      return { total: 0, public: 0, private: 0 };
    }
  },
  ['wishlist-stats'], // Base cache key
  { revalidate: 1800, tags: ['wishlists'] } // Cache voor 30 min, tag voor on-demand revalidatie
);

// We kunnen hier in de toekomst meer functies toevoegen, bv:
// - getWishlistById(id: string)
// - getRecentPublicWishlists()
// etc.