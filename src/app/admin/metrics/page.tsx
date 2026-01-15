// src/app/admin/metrics/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getMetricsData } from '@/lib/server/data/metrics';
import { MetricsTab } from './_components/metrics-tab';

export const metadata = {
  title: 'Admin Metrics | Wish2Share',
  description: 'Bekijk platform statistieken en analytics',
};

export default async function AdminMetricsPage() {
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

  // 🔹 Ophalen metrics data
  const data = await getMetricsData();

  return <MetricsTab data={data} />;
}
