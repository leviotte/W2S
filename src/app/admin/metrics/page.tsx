// src/app/admin/metrics/page.tsx
import { getSession } from '@/lib/auth/session.server';
import { redirect } from 'next/navigation';
import { getMetricsData } from '@/lib/server/data/metrics';
import { MetricsTab } from './_components/metrics-tab';

export default async function AdminMetricsPage() {
 const session = await getSession();
const user = session?.user;
if (!user || !user.isAdmin) redirect('/');

  const data = await getMetricsData();

  return <MetricsTab data={data} />;
}