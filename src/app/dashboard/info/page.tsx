// src/app/dashboard/info/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import {
  getEventStatsForUser,
  getWishlistStatsForUser,
  getFollowStatsForUser,
} from '@/lib/server/data/user-stats';
import DashboardStatsView from '@/components/dashboard/dashboard-stats-view';

export const metadata = {
  title: 'Dashboard Info - Wish2Share',
  description: 'Bekijk je statistieken en activiteiten',
};

export default async function DashboardInfoPage() {
  // ✅ SERVER-SIDE AUTH CHECK
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login&callbackUrl=/dashboard/info');
  }

  // ✅ PARALLEL DATA FETCHING
  const [eventStats, wishlistStats, followStats] = await Promise.all([
    getEventStatsForUser(currentUser.id),
    getWishlistStatsForUser(currentUser.id),
    getFollowStatsForUser(currentUser.id),
  ]);

  // ✅ DIRECT RENDER - NO WRAPPER NEEDED!
  return (
    <DashboardStatsView
      eventStats={eventStats}
      wishlistStats={wishlistStats}
      followStats={followStats}
      userName={currentUser.displayName || currentUser.email || 'Gebruiker'}
    />
  );
}