// src/app/admin/settings/affiliate-stores/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getAffiliateStats } from '@/lib/server/data/affiliate-stats';
import { AffiliateStoresStats } from './_components/affiliate-stores-stats';

export const metadata = {
  title: 'Affiliate Stores | Wish2Share',
  description: 'Beheer affiliate partnerships',
};

export default async function AffiliateStoresSettingsPage() {
  // 🔹 Haal session op via NextAuth
  const session = await getServerSession(authOptions);
  const sessionUserRaw = session?.user ?? null;

  // 🔹 Map session → user object voor admin-check
  const user = sessionUserRaw
    ? {
        isLoggedIn: true,
        id: sessionUserRaw.id,
        email: sessionUserRaw.email ?? '',
        displayName: sessionUserRaw.name ?? sessionUserRaw.email?.split('@')[0] ?? '',
        isAdmin: sessionUserRaw.role === 'admin',
        isPartner: sessionUserRaw.role === 'partner',
        firstName: undefined,
        lastName: undefined,
        photoURL: sessionUserRaw.image ?? null,
        username: undefined,
        createdAt: undefined,
        lastActivity: undefined,
      }
    : null;

  // 🔹 Redirect naar homepage als niet admin
  if (!user || !user.isAdmin) redirect('/');

  // 🔹 Ophalen affiliate stats
  const stats = await getAffiliateStats();

  return <AffiliateStoresStats stats={stats} />;
}
