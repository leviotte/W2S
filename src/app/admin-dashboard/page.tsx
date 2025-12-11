import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/actions';
import { getAdminMetrics } from '@/lib/server/data/metrics';
import { AdminDashboardClient } from './_components/admin-dashboard-client';

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
  // Auth check - redirect als niet admin
  const currentUser = await requireAdmin();
  
  // Await de searchParams (Next.js 15+ async API)
  const params = await searchParams;
  
  // Fetch metrics data (alleen als metrics tab actief is voor performance)
  const metricsData = params.tab === 'metrics' || !params.tab
    ? await getAdminMetrics()
    : null;
  
  // Bepaal de actieve tab (default = metrics)
  const activeTab = params.tab || 'metrics';
  const activeSubTab = params.subTab || '';

  return (
    <AdminDashboardClient
      currentUser={currentUser}
      initialTab={activeTab}
      initialSubTab={activeSubTab}
      metricsData={metricsData}
    />
  );
}