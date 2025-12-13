// src/lib/server/data/blog.ts
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { BlogPost, ClientBlogPost, BlogSection } from '@/types/blog';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map eventuele legacy affiliateProduct naar section.items
 */
function mapLegacyAffiliate(section: BlogSection): BlogSection {
  if (section.affiliateProduct) {
    section.items = section.items ?? [];
    section.items.push({
      id: section.affiliateProduct.id,
      title: section.affiliateProduct.title,
      image: section.affiliateProduct.imageUrl,
      description: '',
      url: section.affiliateProduct.url,
      price: section.affiliateProduct.price?.toString(),
      source: section.affiliateProduct.source,
    });
    delete section.affiliateProduct;
  }
  return section;
}

/**
 * Converteer Firestore Timestamp / TimestampLike / Date naar Date
 */
function toDateSafe(
  timestamp: BlogPost['createdAt'] | BlogPost['updatedAt'] | undefined
): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if ('_seconds' in timestamp && '_nanoseconds' in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date();
}

/**
 * Converteer raw Firestore data naar ClientBlogPost
 */
function convertPost(docData: Partial<BlogPost> & { id: string }): ClientBlogPost {
  const sections = (docData.sections ?? []).map(mapLegacyAffiliate);

  return {
    id: docData.id,
    headTitle: docData.headTitle ?? '',
    headDescription: docData.headDescription ?? '',
    headImage: docData.headImage ?? '',
    subDescription: docData.subDescription,
    sections,
    content: docData.content,
    authorId: docData.authorId,
    authorName: docData.authorName,
    author: docData.author,
    published: docData.published ?? false,
    slug: docData.slug,
    tags: docData.tags ?? [],
    views: docData.views ?? 0,
    metaDescription: docData.metaDescription,
    createdAt: toDateSafe(docData.createdAt),
    updatedAt: docData.updatedAt ? toDateSafe(docData.updatedAt) : undefined,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Haal alle blog posts op, gesorteerd op datum (nieuwste eerst)
 */
export async function getBlogPosts(): Promise<ClientBlogPost[]> {
  try {
    const snapshot = await adminDb
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
      convertPost({ id: doc.id, ...doc.data() as Partial<BlogPost> })
    );
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Cached versie voor betere performance
 */
export const getCachedBlogPosts = cache(
  getBlogPosts,
  ['blog-posts'],
  {
    tags: ['blog', 'posts'],
    revalidate: 300,
  }
);

/**
 * Haal een enkele blog post op
 */
export async function getBlogPost(postId: string): Promise<ClientBlogPost | null> {
  try {
    const doc = await adminDb.collection('posts').doc(postId).get();

    if (!doc.exists) return null;

    return convertPost({ id: doc.id, ...doc.data() as Partial<BlogPost> });
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
