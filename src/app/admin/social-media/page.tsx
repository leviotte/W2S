// src/app/admin/social-media/page.tsx
import { getSession } from '@/lib/auth/session.server';
import { redirect } from 'next/navigation';
import { getCachedSocialMediaAccounts } from '@/lib/server/data/social-media';
import { SocialMediaManager } from './_components/social-media-manager';

export const metadata = {
  title: 'Social Media Beheer | Wish2Share',
  description: 'Beheer je social media accounts',
};

export default async function AdminSocialMediaPage() {
  const session = await getSession();
const user = session?.user;
if (!user || !user.isAdmin) redirect('/');

  const accounts = await getCachedSocialMediaAccounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <SocialMediaManager initialAccounts={accounts} />
    </div>
  );
}