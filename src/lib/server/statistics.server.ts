// src/lib/server/statistics.server.ts
import 'server-only';
import { adminDb } from './firebase-admin';

export interface Statistics {
  totalUsers: number;
  totalEvents: number;
  totalWishlists: number;
  wishlistUserPercentage: number;
  eventUserPercentage: number;
  monthlyUsers: number[];
  monthlyWishlists: number[];
  cumulativeUsers: number[];
  cumulativeWishlists: number[];
  cumulativeEvents: number[];
  monthLabels: string[];
}

export const fetchStatistics = async (): Promise<Statistics> => {
  const db = adminDb;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Labels voor laatste 12 maanden
  const monthLabels = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    return new Date(0, monthIndex).toLocaleString('default', { month: 'short' });
  });

  // Collections references
  const usersCol = db.collection('users');
  const wishlistsCol = db.collection('wishlists');
  const eventsCol = db.collection('events');

  // Totale counts via get()
  const [usersSnap, wishlistsSnap, eventsSnap] = await Promise.all([
    usersCol.get(),
    wishlistsCol.get(),
    eventsCol.get(),
  ]);

  const totalUsers = usersSnap.size;
  const totalWishlists = wishlistsSnap.size;
  const totalEvents = eventsSnap.size;

  // Helper: maandelijkse telling
  const countMonthly = (docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[]) => {
    const result: Record<string, number> = {};
    docs.forEach(doc => {
      const data = doc.data();
      if (!data.createdAt) return;
      let date: Date;
      if (data.createdAt.toDate) date = data.createdAt.toDate(); // Timestamp
      else if (typeof data.createdAt === 'string') date = new Date(data.createdAt); // String
      else date = data.createdAt; // Date
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  };

  const monthlyUsersCount = countMonthly(usersSnap.docs);
  const monthlyWishlistsCount = countMonthly(wishlistsSnap.docs);
  const monthlyEventsCount = countMonthly(eventsSnap.docs);

  // Laatste 12 maanden data
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - 11 + i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      users: monthlyUsersCount[key] || 0,
      wishlists: monthlyWishlistsCount[key] || 0,
      events: monthlyEventsCount[key] || 0,
    };
  });

  const usersGrowth = monthsData.map(d => d.users);
  const wishlistsGrowth = monthsData.map(d => d.wishlists);

  const cumulative = (arr: number[]) => {
    let sum = 0;
    return arr.map(n => (sum += n));
  };

  return {
    totalUsers,
    totalEvents,
    totalWishlists,
    wishlistUserPercentage: totalUsers ? (totalWishlists / totalUsers) * 100 : 0,
    eventUserPercentage: totalUsers ? (totalEvents / totalUsers) * 100 : 0,
    monthlyUsers: usersGrowth,
    monthlyWishlists: wishlistsGrowth,
    cumulativeUsers: cumulative(usersGrowth),
    cumulativeWishlists: cumulative(wishlistsGrowth),
    cumulativeEvents: cumulative(monthsData.map(d => d.events)),
    monthLabels,
  };
};
