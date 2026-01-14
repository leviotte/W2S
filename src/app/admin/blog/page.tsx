// src/app/admin/blog/page.tsx
import { getSession } from '@/lib/auth/session.server';
import { redirect } from 'next/navigation';
import { BlogTab } from './_components/blog-tab';

export default async function AdminBlogPage() {
const session = await getSession();
const user = session?.user;
if (!user || !user.isAdmin) redirect('/');

  return <BlogTab />;
}