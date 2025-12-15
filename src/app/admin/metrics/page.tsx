// src/app/admin/metrics/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
import { redirect } from 'next/navigation';
import { getMetricsData } from '@/lib/server/data/metrics';
import { MetricsTab } from './_components/metrics-tab';

export default async function AdminMetricsPage() {
  const session = await getServerSession();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const data = await getMetricsData();

  return <MetricsTab data={data} />;
}