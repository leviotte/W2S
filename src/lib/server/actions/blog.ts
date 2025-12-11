'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/server/firebase-admin';
import { requireAdmin, getCurrentUser } from '@/lib/auth/actions';
import type { CreateBlogPostInput } from '@/types/blog';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// CREATE POST
// ============================================================================

export async function createBlogPost(
  input: CreateBlogPostInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUser = await requireAdmin();

    const docRef = await adminDb.collection('posts').add({
      ...input,
      createdAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.displayName || currentUser.firstName || 'Admin',
      },
      published: true,
      views: 0,
    });

    // Revalidate blog cache
    revalidateTag('blog');
    revalidateTag('posts');

    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { success: false, error: 'Post aanmaken mislukt' };
  }
}

// ============================================================================
// UPDATE POST
// ============================================================================

export async function updateBlogPost(
  postId: string,
  input: Partial<CreateBlogPostInput>
): Promise<ActionResult> {
  try {
    const currentUser = await requireAdmin();

    await adminDb.collection('posts').doc(postId).update({
      ...input,
      updatedAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.displayName || currentUser.firstName || 'Admin',
      },
    });

    // Revalidate cache
    revalidateTag('blog');
    revalidateTag('posts');
    revalidateTag(`post-${postId}`);
    revalidatePath(`/post/${postId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return { success: false, error: 'Post updaten mislukt' };
  }
}

// ============================================================================
// DELETE POST
// ============================================================================

export async function deleteBlogPost(postId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await adminDb.collection('posts').doc(postId).delete();

    revalidateTag('blog');
    revalidateTag('posts');
    revalidateTag(`post-${postId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return { success: false, error: 'Post verwijderen mislukt' };
  }
}

// ============================================================================
// INCREMENT VIEWS
// ============================================================================

export async function incrementPostViews(postId: string): Promise<void> {
  try {
    const postRef = adminDb.collection('posts').doc(postId);
    
    await postRef.update({
      views: (await postRef.get()).data()?.views ?? 0 + 1,
    });
  } catch (error) {
    console.error('Error incrementing post views:', error);
    // Silent fail - views zijn niet kritiek
  }
}