import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { AffiliateStats } from '@/types/affiliate';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Haal affiliate statistieken op
 * - Aantal stores (hardcoded: Bol.com + Amazon)
 * - Aantal items per store in wishlists
 * - Aantal clicks per store
 */
export async function getAffiliateStats(): Promise<AffiliateStats> {
  try {
    // Parallel fetching voor maximale performance
    const [wishlistsSnapshot, bolClicksSnapshot, amazonClicksSnapshot] = await Promise.all([
      adminDb.collection('wishlists').get(),
      adminDb.collection('clicks').where('source', '==', 'BOL').get(),
      adminDb.collection('clicks').where('source', '==', 'AMZ').get(),
    ]);

    // Count items per source in wishlists
    let bolItemsCount = 0;
    let amazonItemsCount = 0;

    wishlistsSnapshot.docs.forEach((doc) => {
      const wishlist = doc.data();
      if (wishlist.items && Array.isArray(wishlist.items)) {
        wishlist.items.forEach((item: any) => {
          if (item.source === 'BOL') bolItemsCount++;
          if (item.source === 'AMZ') amazonItemsCount++;
        });
      }
    });

    return {
      stores: 2, // Bol.com + Amazon
      bolItems: bolItemsCount,
      amazonItems: amazonItemsCount,
      bolClicks: bolClicksSnapshot.size,
      amazonClicks: amazonClicksSnapshot.size,
    };
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    
    // Return empty stats als fallback
    return {
      stores: 2,
      bolItems: 0,
      amazonItems: 0,
      bolClicks: 0,
      amazonClicks: 0,
    };
  }
}

/**
 * Cached versie voor betere performance
 * Cache: 5 minuten (stats hoeven niet real-time)
 */
export const getCachedAffiliateStats = cache(
  getAffiliateStats,
  ['affiliate-stats'],
  {
    tags: ['affiliate', 'stats'],
    revalidate: 300, // 5 minuten
  }
);