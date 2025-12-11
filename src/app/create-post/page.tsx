import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/actions';
import { CreatePostForm } from './_components/create-post-form';

export const metadata = {
  title: 'Nieuwe Blog Post | Wish2Share',
  description: 'Maak een nieuwe blog post aan',
};

export default async function CreatePostPage() {
  // Auth check
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CreatePostForm />
    </div>
  );
}