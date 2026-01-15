// src/app/admin/backgrounds/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getBackgroundsByType } from '@/lib/server/data/backgrounds';
import { BackgroundsTab } from './_components/backgrounds-tab';

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AdminBackgroundsPage({ searchParams }: Props) {
// 🔹 Haal session op via NextAuth
const session = await getServerSession(authOptions);
const sessionUserRaw = session?.user ?? null;

// 🔹 Map naar jouw oude type / check admin
const user = sessionUserRaw
  ? {
      isLoggedIn: true,
      id: sessionUserRaw.id,
      email: sessionUserRaw.email ?? "",
      displayName: sessionUserRaw.name ?? sessionUserRaw.email?.split("@")[0] ?? "",
      isAdmin: sessionUserRaw.role === "admin",
      isPartner: sessionUserRaw.role === "partner",
      firstName: undefined,
      lastName: undefined,
      photoURL: sessionUserRaw.image ?? null,
      username: undefined,
      createdAt: undefined,
      lastActivity: undefined,
    }
  : null;

// 🔹 Check admin rechten
if (!user || !user.isAdmin) redirect('/');

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