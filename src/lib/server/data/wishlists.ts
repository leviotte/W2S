import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';

interface WishlistStats {
    count: number;
    publicCount: number;
}

/**
 * [FINALE, GECORRIGEERDE VERSIE]
 * Haalt statistieken op over de wishlists van een gebruiker. Gecached.
 * Gebruikt hetzelfde robuuste wrapper-patroon voor dynamische caching per gebruiker.
 */
export const getWishlistStatsForUser = (userId: string) => cache(
  async (): Promise<WishlistStats> => {
    if (!userId) {
      return { count: 0, publicCount: 0 };
    }
    
    try {
      const wishlistsRef = adminDb.collection('wishlists').where('ownerId', '==', userId);

      const [totalCountSnapshot, publicCountSnapshot] = await Promise.all([
          wishlistsRef.count().get(),
          wishlistsRef.where('isPublic', '==', true).count().get()
      ]);

      return {
        count: totalCountSnapshot.data().count,
        publicCount: publicCountSnapshot.data().count,
      };
    } catch (error) {
      console.error(`Error fetching wishlist stats for user ${userId}:`, error);
      return { count: 0, publicCount: 0 };
    }
  },
  ['wishlist-stats-for-user', userId], // De userId is deel van de cache key.
  { 
    tags: [`user-wishlists:${userId}`], // De tag is nu een correcte string array.
    revalidate: 300
  }
)();