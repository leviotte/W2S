// src/app/admin/settings/affiliate-stores/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
import { redirect } from 'next/navigation';
import { getAffiliateStats } from '@/lib/server/data/affiliate-stats';
import { AffiliateStoresStats } from './_components/affiliate-stores-stats';

export default async function AffiliateStoresSettingsPage() {
  const session = await getServerSession();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const stats = await getAffiliateStats();

  return <AffiliateStoresStats stats={stats} />;
}