'use server';

import 'server-only';
import { revalidatePath } from 'next/cache'; // ✅ GEBRUIK revalidatePath in plaats van revalidateTag
import { adminDb } from '@/lib/server/firebase-admin';
import type { Wishlist, WishlistItem } from '@/types/wishlist';
import { wishlistSchema, wishlistItemSchema, productToWishlistItem } from '@/types/wishlist';
import type { Product } from '@/types/product';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// HELPER: Revalidate wishlist cache
// ============================================================================

function revalidateWishlistCache(userId?: string, wishlistId?: string, profileId?: string) {
  // ✅ Revalideer alle relevante paths
  revalidatePath('/dashboard/wishlists');
  revalidatePath('/wishlists');
  
  if (userId) {
    revalidatePath(`/dashboard/wishlists?user=${userId}`);
  }
  
  if (wishlistId) {
    revalidatePath(`/wishlists/${wishlistId}`);
  }
  
  if (profileId) {
    revalidatePath(`/dashboard/wishlists?profile=${profileId}`);
  }
}

// ============================================================================
// GET USER WISHLISTS
// ============================================================================

export async function getUserWishlistsAction(
  userId: string,
  profileId?: string | null
): Promise<ActionResult<Wishlist[]>> {
  try {
    const wishlistsRef = adminDb.collection('wishlists');
    
    let query;
    
    if (profileId && profileId !== 'main-account') {
      query = wishlistsRef.where('profileId', '==', profileId);
    } else {
      query = wishlistsRef
        .where('ownerId', '==', userId)
        .where('profileId', '==', null);
    }

    const snapshot = await query.get();
    
    const wishlists = snapshot.docs.map(doc => {
      const data = doc.data();
      const validation = wishlistSchema.safeParse({
        ...data,
        id: doc.id,
      });

      if (!validation.success) {
        console.error('Wishlist validation failed:', validation.error.flatten());
        return null;
      }

      return validation.data;
    }).filter((w): w is Wishlist => w !== null);

    return { success: true, data: wishlists };
  } catch (error) {
    console.error('Error fetching user wishlists:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het ophalen van de wishlists' 
    };
  }
}

// ============================================================================
// GET WISHLIST BY ID
// ============================================================================

export async function getWishlistByIdAction(
  wishlistId: string
): Promise<ActionResult<Wishlist>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const data = wishlistDoc.data();
    const validation = wishlistSchema.safeParse({
      ...data,
      id: wishlistDoc.id,
    });

    if (!validation.success) {
      console.error('Wishlist validation failed:', validation.error.flatten());
      return { success: false, error: 'Ongeldige wishlist data' };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het ophalen van de wishlist' 
    };
  }
}

// ============================================================================
// GET WISHLIST BY SLUG
// ============================================================================

export async function getWishlistBySlugAction(
  slug: string
): Promise<ActionResult<Wishlist>> {
  try {
    const snapshot = await adminDb
      .collection('wishlists')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistDoc = snapshot.docs[0];
    const data = wishlistDoc.data();
    
    const validation = wishlistSchema.safeParse({
      ...data,
      id: wishlistDoc.id,
    });

    if (!validation.success) {
      console.error('Wishlist validation failed:', validation.error.flatten());
      return { success: false, error: 'Ongeldige wishlist data' };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    console.error('Error fetching wishlist by slug:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het ophalen van de wishlist' 
    };
  }
}

// ============================================================================
// CREATE WISHLIST
// ============================================================================

export async function createWishlistAction(
  userId: string,
  data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    slug?: string;
    eventDate?: string;
    backgroundImage?: string;
    category?: string;
    tags?: string[];
    profileId?: string | null;
  }
): Promise<ActionResult<string>> {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'De naam van de wishlist is verplicht' };
    }

    if (data.name.trim().length < 3) {
      return { success: false, error: 'De naam moet minstens 3 tekens lang zijn' };
    }

    if (data.slug) {
      const existingSlug = await adminDb
        .collection('wishlists')
        .where('slug', '==', data.slug)
        .limit(1)
        .get();

      if (!existingSlug.empty) {
        return { success: false, error: 'Deze slug is al in gebruik' };
      }
    }

    const wishlistId = crypto.randomUUID();
    const isProfileActive = data.profileId && data.profileId !== 'main-account';

    const wishlistDoc: Omit<Wishlist, 'id'> = {
      name: data.name.trim(),
      ownerId: userId,
      ownerName: '',
      isPublic: data.isPublic ?? false,
      description: data.description || null,
      slug: data.slug || null,
      eventDate: data.eventDate || null,
      backgroundImage: data.backgroundImage || null,
      items: [],
      category: data.category,
      tags: data.tags || [],
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // @ts-ignore
      profileId: isProfileActive ? data.profileId : null,
    };

    await adminDb.collection('wishlists').doc(wishlistId).set(wishlistDoc);

    revalidateWishlistCache(userId, wishlistId, data.profileId || undefined);

    return { success: true, data: wishlistId };
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het aanmaken van de wishlist' 
    };
  }
}

// ============================================================================
// UPDATE WISHLIST
// ============================================================================

export async function updateWishlistAction(
  wishlistId: string,
  userId: string,
  updates: Partial<Omit<Wishlist, 'id' | 'ownerId' | 'createdAt'>>
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    if (wishlistData?.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om deze wishlist te bewerken' };
    }

    if (updates.slug && updates.slug !== wishlistData?.slug) {
      const existingSlug = await adminDb
        .collection('wishlists')
        .where('slug', '==', updates.slug)
        .limit(1)
        .get();

      if (!existingSlug.empty) {
        return { success: false, error: 'Deze slug is al in gebruik' };
      }
    }

    await adminDb.collection('wishlists').doc(wishlistId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het updaten van de wishlist' 
    };
  }
}

// ============================================================================
// DELETE WISHLIST
// ============================================================================

export async function deleteWishlistAction(
  wishlistId: string,
  userId: string
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data();
    if (wishlistData?.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om deze wishlist te verwijderen' };
    }

    await adminDb.collection('wishlists').doc(wishlistId).delete();

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het verwijderen van de wishlist' 
    };
  }
}

// ============================================================================
// ADD ITEM TO WISHLIST
// ============================================================================

export async function addItemToWishlistAction(
  wishlistId: string,
  userId: string,
  product: Product,
  options?: {
    quantity?: number;
    priority?: number;
    notes?: string;
  }
): Promise<ActionResult<WishlistItem>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;
    if (wishlistData.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om items toe te voegen aan deze wishlist' };
    }

    const newItem: WishlistItem = {
      ...productToWishlistItem(product),
      quantity: options?.quantity || 1,
      priority: options?.priority,
      notes: options?.notes,
    };

    const validation = wishlistItemSchema.safeParse(newItem);
    if (!validation.success) {
      console.error('Invalid wishlist item:', validation.error.flatten());
      return { success: false, error: 'Ongeldig item' };
    }

    const updatedItems = [...(wishlistData.items || []), validation.data];

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: validation.data };
  } catch (error) {
    console.error('Error adding item to wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het toevoegen van het item' 
    };
  }
}

// ============================================================================
// REMOVE ITEM FROM WISHLIST
// ============================================================================

export async function removeItemFromWishlistAction(
  wishlistId: string,
  userId: string,
  itemId: string
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;
    if (wishlistData.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om items te verwijderen van deze wishlist' };
    }

    const updatedItems = wishlistData.items.filter(item => item.id !== itemId);

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het verwijderen van het item' 
    };
  }
}

// ============================================================================
// UPDATE WISHLIST ITEM
// ============================================================================

export async function updateWishlistItemAction(
  wishlistId: string,
  userId: string,
  itemId: string,
  updates: Partial<Pick<WishlistItem, 'quantity' | 'priority' | 'notes'>>
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;
    if (wishlistData.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om deze wishlist te bewerken' };
    }

    const updatedItems = wishlistData.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het updaten van het item' 
    };
  }
}

// ============================================================================
// RESERVE ITEM
// ============================================================================

export async function reserveItemAction(
  wishlistId: string,
  itemId: string,
  userId: string,
  userName: string
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;

    const item = wishlistData.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Item niet gevonden' };
    }

    if (item.isReserved || item.reservedBy) {
      return { success: false, error: 'Dit item is al gereserveerd' };
    }

    const updatedItems = wishlistData.items.map(i =>
      i.id === itemId
        ? {
            ...i,
            isReserved: true,
            reservedBy: userId,
            claimedBy: {
              userId,
              userName,
              quantity: 1,
              claimedAt: new Date().toISOString(),
            },
          }
        : i
    );

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(undefined, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error reserving item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het reserveren van het item' 
    };
  }
}

// ============================================================================
// UNRESERVE ITEM
// ============================================================================

export async function unreserveItemAction(
  wishlistId: string,
  itemId: string,
  userId: string
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;

    const item = wishlistData.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Item niet gevonden' };
    }

    if (item.reservedBy !== userId) {
      return { success: false, error: 'Je hebt dit item niet gereserveerd' };
    }

    const updatedItems = wishlistData.items.map(i =>
      i.id === itemId
        ? {
            ...i,
            isReserved: false,
            reservedBy: null,
            claimedBy: null,
          }
        : i
    );

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(undefined, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error unreserving item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het unreserveren van het item' 
    };
  }
}

// ============================================================================
// SHARE WISHLIST
// ============================================================================

export async function shareWishlistAction(
  wishlistId: string,
  userId: string,
  targetUserIds: string[]
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;
    if (wishlistData.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om deze wishlist te delen' };
    }

    const currentSharedWith = wishlistData.sharedWith || [];
    const updatedSharedWith = Array.from(new Set([...currentSharedWith, ...targetUserIds]));

    await adminDb.collection('wishlists').doc(wishlistId).update({
      sharedWith: updatedSharedWith,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error sharing wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het delen van de wishlist' 
    };
  }
}

// ============================================================================
// UNSHARE WISHLIST
// ============================================================================

export async function unshareWishlistAction(
  wishlistId: string,
  userId: string,
  targetUserIds: string[]
): Promise<ActionResult<void>> {
  try {
    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!wishlistDoc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = wishlistDoc.data() as Wishlist;
    if (wishlistData.ownerId !== userId) {
      return { success: false, error: 'Je hebt geen toestemming om deze wishlist te bewerken' };
    }

    const updatedSharedWith = (wishlistData.sharedWith || []).filter(
      id => !targetUserIds.includes(id)
    );

    await adminDb.collection('wishlists').doc(wishlistId).update({
      sharedWith: updatedSharedWith,
      updatedAt: new Date().toISOString(),
    });

    revalidateWishlistCache(userId, wishlistId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error unsharing wishlist:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het verwijderen van delen' 
    };
  }
}