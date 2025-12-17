// src/app/blog/[id]/page.tsx

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCachedBlogPost, getBlogPostIds } from '@/lib/server/data/blog';
import { getCurrentUser } from '@/lib/auth/actions';

import { PostContent } from './_components/post-content';

type Props = {
  params: { id: string };
};

// ============================================================================
// SEO METADATA
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getCachedBlogPost(params.id);

  if (!post) {
    return { title: 'Blogpost niet gevonden' };
  }

  return {
    title: `${post.headTitle} | Wish2Share Blog`,
    description: post.headDescription,
    openGraph: {
      title: post.headTitle,
      description: post.headDescription,
      images: [{ url: post.headImage }],
      type: 'article',
      publishedTime: new Date(post.createdAt).toISOString(),
      authors: [post.author?.name ?? 'Wish2Share'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.headTitle,
      description: post.headDescription,
      images: [post.headImage],
    },
  };
}

// ============================================================================
// STATIC GENERATION
// ============================================================================

export async function generateStaticParams() {
  const ids = await getBlogPostIds();
  return ids.slice(0, 10).map((id) => ({ id }));
}

// ISR
export const revalidate = 300;

// ============================================================================
// PAGE
// ============================================================================

export default async function BlogPostPage({ params }: Props) {
  const [post, currentUser] = await Promise.all([
    getCachedBlogPost(params.id),
    getCurrentUser().catch(() => null),
  ]);

  if (!post) notFound();

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.headTitle,
            image: post.headImage,
            datePublished: new Date(post.createdAt).toISOString(),
            dateModified: new Date(post.updatedAt ?? post.createdAt).toISOString(),
            author: {
              '@type': 'Person',
              name: post.author?.name ?? 'Wish2Share',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Wish2Share',
              logo: {
                '@type': 'ImageObject',
                url: 'https://wish2share.com/wish2share.png',
              },
            },
            description: post.headDescription,
          }),
        }}
      />

      <PostContent
        post={post}
        currentUser={currentUser}
        isAdmin={Boolean(currentUser?.isAdmin)}
      />
    </>
  );
}
