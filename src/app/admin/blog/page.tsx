// src/app/admin/blog/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { BlogTab } from './_components/blog-tab';

export const metadata = {
  title: 'Admin Blog | Wish2Share',
  description: 'Beheer blog posts en content',
};

export default async function AdminBlogPage() {
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

  return <BlogTab />;
}
