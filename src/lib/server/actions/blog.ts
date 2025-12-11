'use server';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { revalidatePath, revalidateTag } from '@/lib/utils/revalidate';
import { z } from 'zod';
import { productSchema } from '@/types/product';

// ============================================================================
// ZOD SCHEMAS - JOUW SPECIFIEKE STRUCTUUR
// ============================================================================

const postSectionSchema = z.object({
  id: z.string(),
  subTitle: z.string(),
  content: z.string(),
  items: z.array(productSchema), // ✅ Jouw product schema
});

export type PostSection = z.infer<typeof postSectionSchema>;

const createPostSchema = z.object({
  headTitle: z.string().min(1, 'Titel is verplicht'),
  headDescription: z.string().optional(),
  headImage: z.string().url('Een geldige afbeeldings-URL is vereist'),
  subDescription: z.string().optional(),
  sections: z.array(postSectionSchema),
  published: z.boolean().default(false), // ✅ TOEGEVOEGD
  featured: z.boolean().default(false), // ✅ TOEGEVOEGD
  tags: z.array(z.string()).default([]), // ✅ TOEGEVOEGD
});

const updatePostSchema = createPostSchema.extend({
  id: z.string().min(1, 'Post ID is verplicht'),
});

export type CreatePostData = z.infer<typeof createPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function fromFirestoreTimestamp(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

// ============================================================================
// GET POST ACTION
// ============================================================================

export async function getPostAction(postId: string) {
  try {
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const postData = postDoc.data();
    const post = {
      ...postData,
      id: postDoc.id,
      createdAt: postData?.createdAt
        ? fromFirestoreTimestamp(postData.createdAt)
        : new Date(),
      updatedAt: postData?.updatedAt
        ? fromFirestoreTimestamp(postData.updatedAt)
        : new Date(),
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

    // Filters
    if (options?.published !== undefined) {
      query = query.where('published', '==', options.published);
    }
    if (options?.featured !== undefined) {
      query = query.where('featured', '==', options.featured);
    }
    if (options?.authorId) {
      query = query.where('authorId', '==', options.authorId);
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    // Limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const posts: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      posts.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt
          ? fromFirestoreTimestamp(data.createdAt)
          : new Date(),
        updatedAt: data.updatedAt
          ? fromFirestoreTimestamp(data.updatedAt)
          : new Date(),
      });
    }

    return { success: true, posts };
  } catch (error) {
    console.error('Error in getAllPostsAction:', error);
    return { success: false, error: 'Er is een fout opgetreden', posts: [] };
  }
}

// ============================================================================
// CREATE POST ACTION - ✅ VERBETERD
// ============================================================================

export async function createPostAction(data: unknown) {
  try {
    // ✅ Auth check
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    // ✅ Optional: Admin check (uncomment als alleen admins posts mogen maken)
    // if (!session.user.isAdmin) {
    //   return { success: false, error: 'Geen toestemming' };
    // }

    // ✅ Validatie
    const validationResult = createPostSchema.safeParse(data);
    if (!validationResult.success) {
      console.error(
        'Validatiefout bij aanmaken:',
        validationResult.error.flatten().fieldErrors
      );
      return {
        success: false,
        error: 'De aangeleverde data is ongeldig',
        details: validationResult.error.flatten().fieldErrors,
      };
    }

    // ✅ Create post met metadata
    const userName =
      session.user.displayName ||
      `${session.user.firstName} ${session.user.lastName}`;

    const newPost = {
      ...validationResult.data,
      authorId: session.user.id,
      authorName: userName,
      views: 0, // ✅ View counter
      likes: [], // ✅ Like tracking
      comments: [], // ✅ Comments array
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: validationResult.data.published
        ? FieldValue.serverTimestamp()
        : null,
    };

    const docRef = await adminDb.collection('posts').add(newPost);

    // ✅ Revalidate
    revalidateTag('posts');
    revalidatePath('/blog');

    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Firestore fout bij aanmaken:', error);
    return {
      success: false,
      error: 'Post kon niet worden opgeslagen in de database',
    };
  }
}

// ============================================================================
// UPDATE POST ACTION - ✅ VERBETERD
// ============================================================================

export async function updatePostAction(data: unknown) {
  try {
    // ✅ Auth check
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    // ✅ Validatie
    const validationResult = updatePostSchema.safeParse(data);
    if (!validationResult.success) {
      console.error(
        'Validatiefout bij updaten:',
        validationResult.error.flatten().fieldErrors
      );
      return {
        success: false,
        error: 'De aangeleverde data voor de update is ongeldig',
        details: validationResult.error.flatten().fieldErrors,
      };
    }

    const { id, ...postData } = validationResult.data;

    // ✅ Check ownership (of admin)
    const postRef = adminDb.collection('posts').doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const existingData = postDoc.data();
    const isAuthor = existingData?.authorId === session.user.id;
    const isAdmin = session.user.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Geen toestemming om deze post te bewerken' };
    }

    // ✅ Update met publishedAt check
    const updateData: any = {
      ...postData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Als de post nu gepubliceerd wordt (en dat nog niet was)
    if (postData.published && !existingData?.published) {
      updateData.publishedAt = FieldValue.serverTimestamp();
    }

    await postRef.update(updateData);

    // ✅ Revalidate
    revalidateTag('posts');
    revalidateTag(`post-${id}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`Firestore fout bij bijwerken:`, error);
    return {
      success: false,
      error: 'Post kon niet worden bijgewerkt in de database',
    };
  }
}

// ============================================================================
// DELETE POST ACTION - ✅ VERBETERD
// ============================================================================

export async function deletePostAction(postId: string) {
  try {
    if (!postId) {
      return { success: false, error: 'Post ID ontbreekt' };
    }

    // ✅ Auth check
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Authenticatie vereist' };
    }

    // ✅ Check ownership
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post niet gevonden' };
    }

    const postData = postDoc.data();
    const isAuthor = postData?.authorId === session.user.id;
    const isAdmin = session.user.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Geen toestemming om deze post te verwijderen' };
    }

    await postRef.delete();

    // ✅ Revalidate
    revalidateTag('posts');
    revalidateTag(`post-${postId}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${postId}`);

    return { success: true };
  } catch (error) {
    console.error('Firestore fout bij verwijderen:', error);
    return { success: false, error: 'Post kon niet worden verwijderd' };
  }
}

// ============================================================================
// INCREMENT VIEW COUNT - ✅ NIEUW
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
// TOGGLE LIKE - ✅ NIEUW
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
// ADD COMMENT - ✅ NIEUW
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