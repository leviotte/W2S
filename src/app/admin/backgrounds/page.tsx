// src/app/admin/backgrounds/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
import { redirect } from 'next/navigation';
import { getBackgroundsByType } from '@/lib/server/data/backgrounds';
import { BackgroundsTab } from './_components/backgrounds-tab';

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AdminBackgroundsPage({ searchParams }: Props) {
  const session = await getServerSession();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const params = await searchParams;
  const type = (params.type as 'web' | 'wishlist' | 'event') || 'web';

  const { images, categories } = await getBackgroundsByType(type);

  return (
    <BackgroundsTab 
      subTab={type}
      initialImages={images}
      initialCategories={categories}
    />
  );
}