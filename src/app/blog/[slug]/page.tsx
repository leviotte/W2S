import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostAction, getAllPostsAction } from '@/lib/server/actions/blog';
import { PostContent } from './_components/post-content';
import { getCurrentUserProfileFromSession } from '@/lib/server/actions/user-actions';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPostAction(params.slug);
  const post = result?.success ? result.post : null;

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

export async function generateStaticParams() {
  const result = await getAllPostsAction({ published: true });
  if (!result.success) return [];
  return result.posts.map((post: any) => ({ slug: post.slug ?? post.id }));
}

export const revalidate = 300;

export default async function BlogPostPage({ params }: Props) {
  const [postResult, currentUser] = await Promise.all([
  getPostAction(params.slug),
  getCurrentUserProfileFromSession().catch(() => null), // ✅ server-first, type-safe
]);
  const post = postResult?.success ? postResult.post : null;

  if (!post) notFound();

  return (
    <>
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