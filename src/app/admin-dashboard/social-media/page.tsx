import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/actions';
import { getCachedSocialMediaAccounts } from '@/lib/server/data/social-media';
import { SocialMediaManager } from './_components/social-media-manager';

export const metadata = {
  title: 'Social Media Beheer | Wish2Share',
  description: 'Beheer je social media accounts',
};

export default async function SocialMediaPage() {
  // Auth check
  await requireAdmin();

  // Fetch existing accounts
  const accounts = await getCachedSocialMediaAccounts();

  return (
    <div className="container mx-auto px-4 py-8">
      <SocialMediaManager initialAccounts={accounts} />
    </div>
  );
}