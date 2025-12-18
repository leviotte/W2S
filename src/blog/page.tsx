// src/app/blog/page.tsx
import { getAllPostsAction } from '@/lib/server/actions/blog';
import { getCurrentUser } from '@/lib/auth/actions';
import PageTitle from '@/components/layout/page-title';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { PostCard } from '@/components/blog/post-card'; // ✅ FIXED IMPORT

export const metadata = {
  title: 'Blog - Wish2Share',
  description: 'Lees onze laatste tips en inspiratie voor events en cadeaus',
};

export default async function BlogPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.isAdmin || false;

  // ✅ Get posts via server action
  const result = await getAllPostsAction({ published: true });
  const posts = result.success ? result.posts : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <PageTitle title="Ons Blog" />
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/posts/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nieuwe Post
            </Link>
          </Button>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-700">
            Nog geen posts...
          </h2>
          <p className="mt-2 text-gray-500">Kom snel terug voor updates!</p>
          {isAdmin && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/posts/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Maak je eerste post
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}