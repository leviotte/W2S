'use server';

import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/auth/session';
import { revalidatePath, revalidateTag } from '@/lib/utils/revalidate'; // ✅ GEFIXED
import { wishlistSchema, type Wishlist, type WishlistItem } from '@/types/wishlist';
import { z } from 'zod';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toFirestoreTimestamp(date: Date | string): Timestamp {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return Timestamp.fromDate(new Date(date));
}

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
// GET WISHLIST ACTION
// ============================================================================

export async function getWishlistAction(wishlistId: string) {
  try {
    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    const wishlist = {
      ...wishlistData,
      id: wishlistDoc.id,
      createdAt: fromFirestoreTimestamp(wishlistData?.createdAt),
      updatedAt: fromFirestoreTimestamp(wishlistData?.updatedAt),
    };

    const validation = wishlistSchema.safeParse(wishlist);

    if (!validation.success) {
      console.error('Wishlist validation failed:', validation.error);
      return { success: false, error: 'Ongeldige wishlist data' };
    }

    return { success: true, wishlist: validation.data };
  } catch (error) {
    console.error('Error in getWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden' };
  }
}

// ============================================================================
// GET USER WISHLISTS ACTION
// ============================================================================

export async function getUserWishlistsAction(userId: string) {
  try {
    const wishlistsRef = adminDb.collection('wishlists');
    const snapshot = await wishlistsRef.where('ownerId', '==', userId).get();

    const wishlists: Wishlist[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const wishlist = {
        ...data,
        id: doc.id,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
      };

      const validation = wishlistSchema.safeParse(wishlist);
      if (validation.success) {
        wishlists.push(validation.data);
      }
    }

    return { success: true, wishlists };
  } catch (error) {
    console.error('Error in getUserWishlistsAction:', error);
    return { success: false, error: 'Er is een fout opgetreden', wishlists: [] };
  }
}

// ============================================================================
// CREATE WISHLIST ACTION
// ============================================================================

export async function createWishlistAction(wishlistData: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const userId = session.user.id;

    const newWishlist = {
      ...wishlistData,
      ownerId: userId,
      // ❌ VERWIJDER isPrivate (bestaat niet in schema)
      // isPrivate: wishlistData.isPrivate || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const wishlistRef = await adminDb.collection('wishlists').add(newWishlist);

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath('/dashboard/wishlists');

    return { success: true, wishlistId: wishlistRef.id };
  } catch (error) {
    console.error('Error in createWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het aanmaken' };
  }
}

// ============================================================================
// UPDATE WISHLIST ACTION
// ============================================================================

export async function updateWishlistAction(wishlistId: string, updates: Partial<Wishlist>) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const updateData: any = { ...updates };
    updateData.updatedAt = Timestamp.now();

    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    await wishlistRef.update(updateData);

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath(`/dashboard/wishlists/${wishlistId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in updateWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het updaten' };
  }
}

// ============================================================================
// DELETE WISHLIST ACTION
// ============================================================================

export async function deleteWishlistAction(wishlistId: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const userId = session.user.id;

    // Check if user is owner
    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    if (wishlistData?.ownerId !== userId) {
      return { success: false, error: 'Geen toestemming om deze wishlist te verwijderen' };
    }

    // Delete wishlist
    await wishlistRef.delete();

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath('/dashboard/wishlists');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het verwijderen' };
  }
}

// ============================================================================
// ADD ITEM TO WISHLIST ACTION
// ============================================================================

export async function addItemToWishlistAction(wishlistId: string, item: WishlistItem) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const currentItems = wishlistDoc.data()?.items || [];
    const updatedItems = [...currentItems, item];

    await wishlistRef.update({
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath(`/dashboard/wishlists/${wishlistId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in addItemToWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het toevoegen' };
  }
}

// ============================================================================
// REMOVE ITEM FROM WISHLIST ACTION
// ============================================================================

export async function removeItemFromWishlistAction(wishlistId: string, itemId: string | number) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const currentItems = wishlistDoc.data()?.items || [];
    const updatedItems = currentItems.filter((item: WishlistItem) => item.id !== itemId);

    await wishlistRef.update({
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath(`/dashboard/wishlists/${wishlistId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in removeItemFromWishlistAction:', error);
    return { success: false, error: 'Er is een fout opgetreden bij het verwijderen' };
  }
}

// ============================================================================
// TOGGLE ITEM RESERVED ACTION
// ============================================================================

export async function toggleItemReservedAction(
  wishlistId: string,
  itemId: string | number,
  reservedBy?: string | null
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return { success: false, error: 'Niet geauthenticeerd' };
    }

    const wishlistRef = adminDb.collection('wishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const currentItems = wishlistDoc.data()?.items || [];
    const updatedItems = currentItems.map((item: WishlistItem) => {
      if (item.id === itemId) {
        return {
          ...item,
          reserved: !!reservedBy,
          reservedBy: reservedBy || null,
        };
      }
      return item;
    });

    await wishlistRef.update({
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });

    // Revalidate
    revalidateTag('wishlists');
    revalidatePath(`/dashboard/wishlists/${wishlistId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in toggleItemReservedAction:', error);
    return { success: false, error: 'Er is een fout opgetreden' };
  }
}