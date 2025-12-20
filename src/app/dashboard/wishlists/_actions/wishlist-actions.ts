// src/app/dashboard/wishlists/_actions/wishlist-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/actions';

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * ✅ Toggle wishlist privacy (isPublic)
 */
export async function toggleWishlistPrivacyAction(
  wishlistId: string,
  isPrivate: boolean
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session.user) {
      return { success: false, error: 'Niet geautoriseerd' };
    }

    // Check ownership
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();
    
    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    if (wishlistData?.ownerId !== session.user.id) {
      return { success: false, error: 'Niet geautoriseerd om deze wishlist te wijzigen' };
    }

    // Update isPublic field
    await adminDb.collection('wishlists').doc(wishlistId).update({
      isPublic: !isPrivate, // isPrivate = true → isPublic = false
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/dashboard/wishlists');
    
    return { success: true };
  } catch (error) {
    console.error('toggleWishlistPrivacyAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon privacy niet wijzigen',
    };
  }
}

/**
 * ✅ Delete wishlist
 */
export async function deleteWishlistAction(wishlistId: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session.user) {
      return { success: false, error: 'Niet geautoriseerd' };
    }

    // Check ownership
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();
    
    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    if (wishlistData?.ownerId !== session.user.id) {
      return { success: false, error: 'Niet geautoriseerd om deze wishlist te verwijderen' };
    }

    // Delete wishlist
    await adminDb.collection('wishlists').doc(wishlistId).delete();

    revalidatePath('/dashboard/wishlists');
    
    return { success: true };
  } catch (error) {
    console.error('deleteWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet verwijderen',
    };
  }
}