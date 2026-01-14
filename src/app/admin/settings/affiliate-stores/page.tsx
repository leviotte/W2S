// src/app/admin/settings/affiliate-stores/page.tsx
import { getSession } from '@/lib/auth/session.server';
import { redirect } from 'next/navigation';
import { getAffiliateStats } from '@/lib/server/data/affiliate-stats';
import { AffiliateStoresStats } from './_components/affiliate-stores-stats';

export default async function AffiliateStoresSettingsPage() {
  const session = await getSession();
const user = session?.user;
if (!user || !user.isAdmin) redirect('/');

  const stats = await getAffiliateStats();

  return <AffiliateStoresStats stats={stats} />;
}