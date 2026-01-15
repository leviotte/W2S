// src/app/admin/social-media/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getCachedSocialMediaAccounts } from '@/lib/server/data/social-media';
import { SocialMediaManager } from './_components/social-media-manager';

export const metadata = {
  title: 'Social Media Beheer | Wish2Share',
  description: 'Beheer je social media accounts',
};

export default async function AdminSocialMediaPage() {
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

  // 🔹 Ophalen social media accounts
  const accounts = await getCachedSocialMediaAccounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <SocialMediaManager initialAccounts={accounts} />
    </div>
  );
}
