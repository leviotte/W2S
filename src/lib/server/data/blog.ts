import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { BlogPost } from '@/types/blog';

// ============================================================================
// HELPERS
// ============================================================================

function convertTimestamp(data: any): any {
  if (!data) return data;
  
  const converted: any = { ...data };
  
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    converted.createdAt = data.createdAt.toDate();
  }
  
  if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
    converted.updatedAt = data.updatedAt.toDate();
  }
  
  return converted;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Haal alle blog posts op, gesorteerd op datum (nieuwste eerst)
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const snapshot = await adminDb
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BlogPost[];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Cached versie voor betere performance
 * Cache: 5 minuten (blog posts zijn relatief statisch)
 */
export const getCachedBlogPosts = cache(
  getBlogPosts,
  ['blog-posts'],
  {
    tags: ['blog', 'posts'],
    revalidate: 300, // 5 minuten
  }
);

/**
 * Haal een enkele blog post op
 */
export async function getBlogPost(postId: string): Promise<BlogPost | null> {
  try {
    const doc = await adminDb
      .collection('posts')
      .doc(postId)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...convertTimestamp(doc.data()),
    } as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

/**
 * Cached versie voor individuele post
 */
export const getCachedBlogPost = (postId: string) => cache(
  () => getBlogPost(postId),
  [`blog-post-${postId}`],
  {
    tags: ['blog', 'posts', `post-${postId}`],
    revalidate: 300,
  }
)();