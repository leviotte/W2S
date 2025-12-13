// src/app/blog/page.tsx
import { Metadata } from 'next';
import { getCachedBlogPosts } from '@/lib/server/data/blog';
import { getCurrentUser } from '@/lib/auth/actions';
import { BlogGrid } from './_components/blog-grid';

// ✅ Re-export het type voor backwards compatibility
export type { PostSummary } from '@/types/blog';

export const metadata: Metadata = {
  title: 'Blog - Inspiratie & Cadeau-ideeën | Wish2Share',
  description: 'De bron voor cadeau-ideeën en inspiratie voor je verlanglijst. Van trendy gadgets tot unieke items, hier vind je alles voor het perfecte cadeau en je ideale verlanglijst.',
  openGraph: {
    title: 'Blog - Inspiratie & Cadeau-ideeën | Wish2Share',
    description: 'De bron voor cadeau-ideeën en inspiratie voor je verlanglijst.',
    type: 'website',
  },
};

export const revalidate = 300; // Revalidate elke 5 minuten

export default async function BlogPage() {
  // Parallel data fetching
  const [posts, currentUser] = await Promise.all([
    getCachedBlogPosts(),
    getCurrentUser().catch(() => null),
  ]);

  const isAdmin = currentUser?.isAdmin || false;

  return (
    <section className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <BlogGrid 
          posts={posts} 
          isAdmin={isAdmin}
        />
      </div>
    </section>
  );
}