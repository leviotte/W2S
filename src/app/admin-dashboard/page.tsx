import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/actions';
import { getAdminMetrics } from '@/lib/server/data/metrics';
import { 
  getBackgroundImages, 
  getBackgroundCategories 
} from '@/lib/server/data/backgrounds';
import { getCachedAffiliateStats } from '@/lib/server/data/affiliate-stats'; // ✅ ADD
import { AdminDashboardClient } from './_components/admin-dashboard-client';
import type { BackgroundType } from '@/types/background';

export const metadata = {
  title: 'Admin Dashboard | Wish2Share',
  description: 'Beheer gebruikers, events, blog posts en meer',
};

type Props = {
  searchParams: Promise<{ 
    tab?: string; 
    subTab?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  // Auth check
  const currentUser = await requireAdmin();
  
  // Await searchParams
  const params = await searchParams;
  const activeTab = params.tab || 'metrics';
  const activeSubTab = params.subTab || '';

  // Conditional data fetching voor performance
  const metricsData = activeTab === 'metrics' 
    ? await getAdminMetrics()
    : null;

  // Fetch backgrounds data
  let backgroundsData = null;
  if (activeTab === 'backgrounds') {
    const type: BackgroundType = 
      activeSubTab === 'event' ? 'event'
      : activeSubTab === 'wishlist' ? 'wishlist'
      : 'web';
    
    const [images, categories] = await Promise.all([
      getBackgroundImages(type),
      getBackgroundCategories(type),
    ]);
    
    backgroundsData = { images, categories };
  }

  // ✅ Fetch affiliate stats
  let affiliateStats = null;
  if (activeTab === 'settings' && activeSubTab === 'affiliate-stores') {
    affiliateStats = await getCachedAffiliateStats();
  }

  return (
    <AdminDashboardClient
      currentUser={currentUser}
      initialTab={activeTab}
      initialSubTab={activeSubTab}
      metricsData={metricsData}
      backgroundsData={backgroundsData}
      affiliateStats={affiliateStats} // ✅ ADD
    />
  );
}