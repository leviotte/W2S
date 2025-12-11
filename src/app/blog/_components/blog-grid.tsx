'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BlogPost } from '@/types/blog';
import { BlogPostCard } from './blog-post-card';

type Props = {
  posts: BlogPost[];
  isAdmin: boolean;
};

export function BlogGrid({ posts, isAdmin }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
            Vind Inspiratie op onze{' '}
            <span className="text-accent">Blog</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl">
            De bron voor cadeau-ideeën en inspiratie voor je verlanglijst. Van
            trendy gadgets tot unieke items, hier vind je alles voor het perfecte
            cadeau en je ideale verlanglijst.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => router.push('/create-post')}
            className="shrink-0"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nieuw
          </Button>
        )}
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.map((post) => (
            <BlogPostCard 
              key={post.id} 
              post={post} 
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nog geen blog posts beschikbaar.
          </p>
          {isAdmin && (
            <Button
              onClick={() => router.push('/create-post')}
              className="mt-4"
            >
              <Plus className="h-5 w-5 mr-2" />
              Eerste post aanmaken
            </Button>
          )}
        </div>
      )}
    </div>
  );
}