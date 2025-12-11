import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/actions';
import { getCachedBlogPost } from '@/lib/server/data/blog';
import { UpdatePostForm } from './_components/update-post-form';

export const metadata = {
  title: 'Post Bewerken | Wish2Share',
  description: 'Bewerk je blog post',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UpdatePostPage({ params }: Props) {
  // Auth check
  await requireAdmin();

  const { id } = await params;
  const post = await getCachedBlogPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <UpdatePostForm post={post} />
    </div>
  );
}