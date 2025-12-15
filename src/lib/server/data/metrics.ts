import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

export type MonthlyMetrics = {
  users: number;
  wishlists: number;
  events: number;
};

export type MetricsData = {
  // Totals
  totalUsers: number;
  totalEvents: number;
  totalWishlists: number;
  
  // Percentages
  wishlistUserPercentage: number;
  eventUserPercentage: number;
  
  // Monthly data (last 12 months)
  monthLabels: string[];
  monthlyUsers: number[];
  monthlyWishlists: number[];
  monthlyEvents: number[];
  
  // Cumulative data
  cumulativeUsers: number[];
  cumulativeWishlists: number[];
  cumulativeEvents: number[];
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Genereert labels voor de laatste 12 maanden
 */
function generateLast12MonthLabels(): string[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  return Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    return new Date(0, monthIndex).toLocaleString('nl-BE', { month: 'long' });
  });
}

/**
 * Genereert maand keys voor de laatste 12 maanden (YYYY-MM formaat)
 */
function generateLast12MonthKeys(): Array<{ key: string; date: Date }> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return Array.from({ length: 12 }, (_, i) => {
    const monthOffset = i - 11; // -11, -10, ..., -1, 0
    const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const key = `${targetYear}-${targetMonth}`;
    
    return { key, date: targetDate };
  });
}

/**
 * Converteer Firestore Timestamp naar Date
 */
function timestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // String timestamp
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Fallback
  try {
    return new Date(timestamp);
  } catch {
    return null;
  }
}

/**
 * Process documents en groepeer per maand
 */
function processDocumentsByMonth(
  docs: any[],
  fieldName: string = 'createdAt'
): Record<string, number> {
  const monthlyCounts: Record<string, number> = {};
  
  docs.forEach((doc) => {
    const data = doc.data();
    const timestamp = data[fieldName];
    const date = timestampToDate(timestamp);
    
    if (date) {
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    }
  });
  
  return monthlyCounts;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Haal alle metrics op voor het admin dashboard
 * CACHED: 5 minuten (metrics hoeven niet real-time te zijn)
 */
export const getAdminMetrics = cache(
  async (): Promise<MetricsData> => {
    try {
      // Parallel data fetching voor performance
      const [usersSnapshot, eventsSnapshot, wishlistsSnapshot] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('events').get(),
        adminDb.collection('wishlists').get(),
      ]);

      // Totals
      const totalUsers = usersSnapshot.size;
      const totalEvents = eventsSnapshot.size;
      const totalWishlists = wishlistsSnapshot.size;

      // Process monthly data
      const monthlyUsersCount = processDocumentsByMonth(usersSnapshot.docs);
      const monthlyWishlistsCount = processDocumentsByMonth(wishlistsSnapshot.docs);
      const monthlyEventsCount = processDocumentsByMonth(eventsSnapshot.docs);

      // Generate month labels and keys
      const monthLabels = generateLast12MonthLabels();
      const monthKeys = generateLast12MonthKeys();

      // Map data to last 12 months
      const monthsData = monthKeys.map(({ key }) => ({
        users: monthlyUsersCount[key] || 0,
        wishlists: monthlyWishlistsCount[key] || 0,
        events: monthlyEventsCount[key] || 0,
      }));

      // Extract monthly arrays
      const monthlyUsers = monthsData.map((m) => m.users);
      const monthlyWishlists = monthsData.map((m) => m.wishlists);
      const monthlyEvents = monthsData.map((m) => m.events);

      // Calculate cumulative totals
      const cumulativeUsers: number[] = [];
      const cumulativeWishlists: number[] = [];
      const cumulativeEvents: number[] = [];

      let userSum = 0;
      let wishlistSum = 0;
      let eventSum = 0;

      monthsData.forEach((data) => {
        userSum += data.users;
        wishlistSum += data.wishlists;
        eventSum += data.events;

        cumulativeUsers.push(userSum);
        cumulativeWishlists.push(wishlistSum);
        cumulativeEvents.push(eventSum);
      });

      // Calculate percentages
      const wishlistUserPercentage = totalUsers > 0 
        ? (totalWishlists / totalUsers) * 100 
        : 0;
      
      const eventUserPercentage = totalUsers > 0 
        ? (totalEvents / totalUsers) * 100 
        : 0;

      return {
        totalUsers,
        totalEvents,
        totalWishlists,
        wishlistUserPercentage,
        eventUserPercentage,
        monthLabels,
        monthlyUsers,
        monthlyWishlists,
        monthlyEvents,
        cumulativeUsers,
        cumulativeWishlists,
        cumulativeEvents,
      };
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      
      // Return empty metrics als fallback
      const emptyArray = new Array(12).fill(0);
      return {
        totalUsers: 0,
        totalEvents: 0,
        totalWishlists: 0,
        wishlistUserPercentage: 0,
        eventUserPercentage: 0,
        monthLabels: generateLast12MonthLabels(),
        monthlyUsers: emptyArray,
        monthlyWishlists: emptyArray,
        monthlyEvents: emptyArray,
        cumulativeUsers: emptyArray,
        cumulativeWishlists: emptyArray,
        cumulativeEvents: emptyArray,
      };
    }
  },
  ['admin-metrics'],
  {
    tags: ['admin', 'metrics'],
    revalidate: 300, // 5 minuten cache
  }
);

// ============================================================================
// EXPORT ALIASES (✅ NIEUW)
// ============================================================================

/**
 * Alias voor backward compatibility
 */
export const getMetricsData = getAdminMetrics;

// Default export
export default getAdminMetrics;