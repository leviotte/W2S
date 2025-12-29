// src/app/admin/blog/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
import { redirect } from 'next/navigation';
import { BlogTab } from './_components/blog-tab';

export default async function AdminBlogPage() {
  const session = await getServerSession();

  if (!session.user.isLoggedIn || !session.user.isAdmin) {
  redirect('/');
}

  return <BlogTab />;
}