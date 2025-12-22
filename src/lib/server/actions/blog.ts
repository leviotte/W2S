// src/lib/server/actions/blog.ts
'use server';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { revalidatePath, revalidateTag } from '@/lib/utils/revalidate';
import { z } from 'zod';
import { productSchema } from '@/types/product';
import { BlogPost } from '@/types/blog';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const postSectionSchema = z.object({
  id: z.string(),
  subTitle: z.string(),
  content: z.string(),
  items: z.array(productSchema),
});

const createPostSchema = z.object({
  headTitle: z.string().min(1, 'Titel is verplicht'),
  headDescription: z.string().optional(),
  headImage: z.string().url('Een geldige afbeeldings-URL is vereist'),
  subDescription: z.string().optional(),
  sections: z.array(postSectionSchema),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1, 'Post ID is verplicht'),
});

export type CreatePostData = z.infer<typeof createPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;

// ============================================================================
// FORM STATE TYPE (voor useFormState)
// ============================================================================

export type CreatePostFormState = {
  success: boolean;
  message: string;
  errors?: {
    headTitle?: string[];
    headDescription?: string[];
    headImage?: string[];
    sections?: string[];
    [key: string]: string[] | undefined;
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function fromFirestoreTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date(timestamp);
}

// ============================================================================
// GET POST ACTION
// ============================================================================

export async function getPostAction(postId: string): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  try {
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const d = postDoc.data()!;
    const post: BlogPost = {
      id: postDoc.id,
      slug: d.slug ?? postDoc.id,
      headTitle: d.headTitle ?? '',
      headDescription: d.headDescription ?? '',
      subDescription: d.subDescription ?? '',
      headImage: d.headImage ?? '',
      sections: d.sections ?? [],
      author: d.author ?? undefined,
      views: d.views ?? undefined,
      createdAt: d.createdAt ? fromFirestoreTimestamp(d.createdAt) : new Date(),
      updatedAt: d.updatedAt ? fromFirestoreTimestamp(d.updatedAt) : undefined,
    };
    return { success: true, post };
  } catch (error) {
    console.error('Error in getPostAction:', error);
    return { success: false, error: 'Er is een fout opgetreden' };
  }
}

// ============================================================================
// GET ALL POSTS ACTION
// ============================================================================

export async function getAllPostsAction(options?: {
  published?: boolean;
  featured?: boolean;
  authorId?: string;
  limit?: number;
}) {
  try {
    let query = adminDb.collection('posts') as any;

    if (options?.published !== undefined) {
      query = query.where('published', '==', options.published);
    }
    if (options?.featured !== undefined) {
      query = query.where('featured', '==', options.featured);
    }
    if (options?.authorId) {
      query = query.where('authorId', '==', options.authorId);
    }

    query = query.orderBy('createdAt', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const posts: BlogPost[] = [];

    for (const doc of snapshot.docs) {
      const d = doc.data();
      posts.push({
        id: doc.id,
        slug: d.slug ?? doc.id,
        headTitle: d.headTitle ?? '',
        headDescription: d.headDescription ?? '',
        subDescription: d.subDescription ?? '',
        headImage: d.headImage ?? '',
        sections: d.sections ?? [],
        author: d.author ?? undefined,
        views: d.views ?? undefined,
        createdAt: d.createdAt
          ? fromFirestoreTimestamp(d.createdAt)
          : new Date(),
        updatedAt: d.updatedAt
          ? fromFirestoreTimestamp(d.updatedAt)
          : undefined,
      });
    }

    return { success: true, posts };
  } catch (error) {
    console.error('Error in getAllPostsAction:', error);
    return { success: false, error: 'Er is een fout opgetreden', posts: [] };
  }
}

// ============================================================================
// CREATE POST ACTION
// ============================================================================

export async function createPostAction(data: unknown) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    const validationResult = createPostSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validatiefout:', validationResult.error.flatten().fieldErrors);
      return {
        success: false,
        error: 'De aangeleverde data is ongeldig',
        details: validationResult.error.flatten().fieldErrors,
      };
    }

    const userName =
      session.user.displayName ||
      `${session.user.firstName} ${session.user.lastName}`;

    const newPost = {
      ...validationResult.data,
      authorId: session.user.id,
      authorName: userName,
      views: 0,
      likes: [],
      comments: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: validationResult.data.published
        ? FieldValue.serverTimestamp()
        : null,
    };

    const docRef = await adminDb.collection('posts').add(newPost);

    revalidateTag('posts');
    revalidatePath('/blog');

    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Firestore fout:', error);
    return {
      success: false,
      error: 'Post kon niet worden opgeslagen',
    };
  }
}

// ============================================================================
// UPDATE POST ACTION - ✅ FIXED SIGNATURE
// ============================================================================

export async function updatePostAction(data: unknown) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    const validationResult = updatePostSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validatiefout:', validationResult.error.flatten().fieldErrors);
      return {
        success: false,
        error: 'De aangeleverde data is ongeldig',
        details: validationResult.error.flatten().fieldErrors,
      };
    }

    const { id, ...postData } = validationResult.data;

    const postRef = adminDb.collection('posts').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const existingData = postDoc.data();
    const isAuthor = existingData?.authorId === session.user.id;
    const isAdmin = session.user.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Geen toestemming' };
    }

    const updateData: any = {
      ...postData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (postData.published && !existingData?.published) {
      updateData.publishedAt = FieldValue.serverTimestamp();
    }

    await postRef.update(updateData);

    revalidateTag('posts');
    revalidateTag(`post-${id}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Firestore fout:', error);
    return {
      success: false,
      error: 'Post kon niet worden bijgewerkt',
    };
  }
}

// ============================================================================
// DELETE POST ACTION
// ============================================================================

export async function deletePostAction(postId: string) {
  try {
    if (!postId) {
      return { success: false, error: 'Post ID ontbreekt' };
    }

    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const postData = postDoc.data();
    const isAuthor = postData?.authorId === session.user.id;
    const isAdmin = session.user.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Geen toestemming' };
    }

    await postRef.delete();

    revalidateTag('posts');
    revalidateTag(`post-${postId}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${postId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Firestore fout:', error);
    return { success: false, error: 'Post kon niet worden verwijderd' };
  }
}

// ============================================================================
// INCREMENT VIEW COUNT
// ============================================================================

export async function incrementViewCountAction(postId: string) {
  try {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update({
      views: FieldValue.increment(1),
    });

    return { success: true };
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return { success: false };
  }
}

// ============================================================================
// TOGGLE LIKE
// ============================================================================

export async function toggleLikeAction(postId: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    const userId = session.user.id;
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const likes = postDoc.data()?.likes || [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      await postRef.update({
        likes: FieldValue.arrayRemove(userId),
      });
    } else {
      await postRef.update({
        likes: FieldValue.arrayUnion(userId),
      });
    }

    revalidateTag(`post-${postId}`);

    return { success: true, liked: !hasLiked };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: 'Er is een fout opgetreden' };
  }
}

// ============================================================================
// ADD COMMENT
// ============================================================================

export async function addCommentAction(postId: string, content: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Reactie mag niet leeg zijn' };
    }

    const comment = {
      id: adminDb.collection('temp').doc().id,
      userId: session.user.id,
      userName:
        session.user.displayName ||
        `${session.user.firstName} ${session.user.lastName}`,
      userPhoto: session.user.photoURL || null,
      content: content.trim(),
      createdAt: Timestamp.now(),
    };

    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update({
      comments: FieldValue.arrayUnion(comment),
    });

    revalidateTag(`post-${postId}`);

    return { success: true, comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Er is een fout opgetreden' };
  }
}