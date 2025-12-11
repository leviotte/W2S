import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCachedBlogPost, getCachedBlogPosts } from '@/lib/server/data/blog';
import { getCurrentUser } from '@/lib/auth/session';
import { incrementPostViews } from '@/lib/server/actions/blog';
import { PostContent } from './_components/post-content';

type Props = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// METADATA (DYNAMIC SEO)
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getCachedBlogPost(id);

  if (!post) {
    return {
      title: 'Post niet gevonden',
    };
  }

  return {
    title: `${post.headTitle} | Wish2Share Blog`,
    description: post.headDescription,
    openGraph: {
      title: post.headTitle,
      description: post.headDescription,
      images: [{ url: post.headImage }],
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author?.name || 'Wish2Share'],
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
// STATIC GENERATION (voor populaire posts)
// ============================================================================

export async function generateStaticParams() {
  const posts = await getCachedBlogPosts();
  
  // Genereer statische pagina's voor de 10 meest recente posts
  return posts.slice(0, 10).map((post) => ({
    id: post.id,
  }));
}

// ISR: revalidate elke 5 minuten
export const revalidate = 300;

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  
  // Parallel fetching
  const [post, currentUser] = await Promise.all([
    getCachedBlogPost(id),
    getCurrentUser().catch(() => null),
  ]);

  if (!post) {
    notFound();
  }

  // Increment views (non-blocking)
  incrementPostViews(id).catch(() => {});

  const isAdmin = currentUser?.isAdmin || false;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.headTitle,
            image: post.headImage,
            datePublished: post.createdAt.toISOString(),
            dateModified: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
            author: {
              '@type': 'Person',
              name: post.author?.name || 'Wish2Share',
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

      <PostContent post={post} isAdmin={isAdmin} currentUser={currentUser} />
    </>
  );
}