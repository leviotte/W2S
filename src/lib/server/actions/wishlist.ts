// src/lib/server/actions/wishlist.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Wishlist, WishlistItem } from '@/types/wishlist';
import { toDate, nowTimestamp } from '@/lib/utils/time';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateWishlistData {
  name: string;
  description?: string;
  isPublic?: boolean;
  backgroundImage?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface UpdateWishlistData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  backgroundImage?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface UpdateWishlistItemData {
  wishlistId: string;
  itemId: string;
  updates: Partial<WishlistItem>;
}

// ============================================================================
// WISHLIST CRUD OPERATIONS
// ============================================================================

/**
 * ✅ Get all wishlists for a specific user
 */
export async function getUserWishlistsAction(userId: string): Promise<ActionResult<Wishlist[]>> {
  try {
    const wishlistsSnapshot = await adminDb
      .collection('wishlists')
      .where('owner', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const wishlists = wishlistsSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(), // ✅ FIXED
        updatedAt: toDate(data.updatedAt).toISOString(), // ✅ FIXED
      } as Wishlist;
    });

    return { success: true, data: wishlists };
  } catch (error) {
    console.error('getUserWishlistsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlists niet ophalen',
    };
  }
}

/**
 * ✅ Get wishlist by ID
 */
export async function getWishlistByIdAction(wishlistId: string): Promise<ActionResult<Wishlist>> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const data = doc.data();
    
    const wishlist = {
      id: doc.id,
      ...data,
      createdAt: toDate(data?.createdAt).toISOString(), // ✅ FIXED
      updatedAt: toDate(data?.updatedAt).toISOString(), // ✅ FIXED
    } as Wishlist;

    return { success: true, data: wishlist };
  } catch (error) {
    console.error('getWishlistByIdAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet ophalen',
    };
  }
}

/**
 * ✅ Get wishlist by slug
 */
export async function getWishlistBySlugAction(slug: string): Promise<ActionResult<Wishlist>> {
  try {
    const snapshot = await adminDb
      .collection('wishlists')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const wishlist = {
      id: doc.id,
      ...data,
      createdAt: toDate(data?.createdAt).toISOString(), // ✅ FIXED
      updatedAt: toDate(data?.updatedAt).toISOString(), // ✅ FIXED
    } as Wishlist;

    return { success: true, data: wishlist };
  } catch (error) {
    console.error('getWishlistBySlugAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet ophalen',
    };
  }
}

/**
 * ✅ Get wishlist owner (user or profile)
 */
export async function getWishlistOwnerAction(ownerId: string): Promise<ActionResult<any>> {
  try {
    // Try users first
    const userDoc = await adminDb
  .collection('users')
  .doc(ownerId)  // ✅ Direct ophalen met document ID
  .get();

if (userDoc.exists) {
  return { 
    success: true, 
    data: { 
      id: userDoc.id,  // ✅ ID mee teruggeven
      ...userDoc.data() 
    } 
  };
}

    // Try profiles
    const profileSnapshot = await adminDb
      .collection('profiles')
      .where('id', '==', ownerId)
      .limit(1)
      .get();

    if (!profileSnapshot.empty) {
      return { success: true, data: profileSnapshot.docs[0].data() };
    }

    return { success: false, error: 'Owner niet gevonden' };
  } catch (error) {
    console.error('getWishlistOwnerAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon owner niet ophalen',
    };
  }
}

/**
 * ✅ Create a new wishlist
 */
export async function createWishlistAction(
  userId: string,
  data: CreateWishlistData
): Promise<ActionResult<string>> {
  try {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const existingSnapshot = await adminDb
      .collection('wishlists')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    const finalSlug = existingSnapshot.empty ? slug : `${slug}-${Date.now()}`;

    const wishlistData = {
      name: data.name,
      description: data.description || '',
      owner: userId,
      ownerId: userId,
      slug: finalSlug,
      isPublic: data.isPublic ?? false,
      backgroundImage: data.backgroundImage || '',
      minPrice: data.minPrice || 0,
      maxPrice: data.maxPrice || 0,
      items: [],
      sharedWith: [],
      createdAt: nowTimestamp(), // ✅ Already correct
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    const docRef = await adminDb.collection('wishlists').add(wishlistData);

    revalidatePath('/dashboard/wishlists');
    revalidatePath(`/wishlist/${finalSlug}`);

    return { success: true, data: docRef.id };
  } catch (error) {
    console.error('createWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet aanmaken',
    };
  }
}

/**
 * ✅ Update wishlist metadata
 */
export async function updateWishlistAction(
  wishlistId: string,
  updates: UpdateWishlistData
): Promise<ActionResult> {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    await adminDb.collection('wishlists').doc(wishlistId).update(updateData);

    // Get slug for revalidation
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();
    const slug = doc.data()?.slug;

    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('updateWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet bijwerken',
    };
  }
}

/**
 * ✅ Delete a wishlist
 */
export async function deleteWishlistAction(wishlistId: string): Promise<ActionResult> {
  try {
    // Get slug before deletion for revalidation
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();
    const slug = doc.data()?.slug;

    await adminDb.collection('wishlists').doc(wishlistId).delete();

    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('deleteWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet verwijderen',
    };
  }
}

// ============================================================================
// WISHLIST ITEMS OPERATIONS
// ============================================================================

/**
 * ✅ Add item to wishlist
 */
export async function addItemToWishlistAction(
  wishlistId: string,
  item: Partial<WishlistItem>
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const items = wishlistData?.items || [];

    const newItem = {
      id: item.id || `item-${Date.now()}`,
      title: item.title || '',
      description: item.description || '',
      url: item.url || '',
      imageUrl: item.imageUrl || (item as any).image || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      isReserved: false,
      source: item.source || 'Internal',
      platforms: item.platforms || {},
      createdAt: nowTimestamp(), // ✅ Already correct
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    items.push(newItem);

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('addItemToWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon item niet toevoegen',
    };
  }
}

/**
 * ✅ Add item to wishlist (alias for backwards compatibility)
 */
export async function addWishlistItemAction(
  wishlistId: string,
  item: Partial<WishlistItem>
): Promise<ActionResult> {
  return addItemToWishlistAction(wishlistId, item);
}

/**
 * ✅ Update wishlist item
 */
export async function updateWishlistItemAction({
  wishlistId,
  itemId,
  updates,
}: UpdateWishlistItemData): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const items = wishlistData?.items || [];

    const itemIndex = items.findIndex(
      (item: WishlistItem) => String(item.id) === String(itemId)
    );

    if (itemIndex === -1) {
      return { success: false, error: 'Item niet gevonden' };
    }

    items[itemIndex] = {
      ...items[itemIndex],
      ...updates,
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('updateWishlistItemAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon item niet bijwerken',
    };
  }
}

/**
 * ✅ Delete wishlist item
 */
export async function deleteWishlistItemAction(
  wishlistId: string,
  itemId: string
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const items = wishlistData?.items || [];

    const filteredItems = items.filter(
      (item: WishlistItem) => String(item.id) !== String(itemId)
    );

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: filteredItems,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('deleteWishlistItemAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon item niet verwijderen',
    };
  }
}

/**
 * ✅ Remove item from wishlist (alias for backwards compatibility)
 */
export async function removeItemFromWishlistAction(
  wishlistId: string,
  itemId: string
): Promise<ActionResult> {
  return deleteWishlistItemAction(wishlistId, itemId);
}

// ============================================================================
// RESERVATION OPERATIONS
// ============================================================================

/**
 * ✅ Reserve an item
 */
export async function reserveItemAction(
  wishlistId: string,
  itemId: string,
  userId: string,
  userName: string
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const items = wishlistData?.items || [];

    const itemIndex = items.findIndex(
      (item: WishlistItem) => String(item.id) === String(itemId)
    );

    if (itemIndex === -1) {
      return { success: false, error: 'Item niet gevonden' };
    }

    if (items[itemIndex].isReserved) {
      return { success: false, error: 'Item is al gereserveerd' };
    }

    items[itemIndex] = {
      ...items[itemIndex],
      isReserved: true,
      reservedBy: userId,
      reservedByName: userName,
      reservedAt: nowTimestamp(), // ✅ Already correct
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('reserveItemAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon item niet reserveren',
    };
  }
}

/**
 * ✅ Unreserve an item
 */
export async function unreserveItemAction(
  wishlistId: string,
  itemId: string
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const items = wishlistData?.items || [];

    const itemIndex = items.findIndex(
      (item: WishlistItem) => String(item.id) === String(itemId)
    );

    if (itemIndex === -1) {
      return { success: false, error: 'Item niet gevonden' };
    }

    items[itemIndex] = {
      ...items[itemIndex],
      isReserved: false,
      reservedBy: null,
      reservedByName: null,
      reservedAt: null,
      updatedAt: nowTimestamp(), // ✅ Already correct
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('unreserveItemAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon reservering niet verwijderen',
    };
  }
}

// ============================================================================
// SHARING OPERATIONS
// ============================================================================

/**
 * ✅ Share wishlist with someone
 */
export async function shareWishlistAction(
  wishlistId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const sharedWith = wishlistData?.sharedWith || [];

    if (sharedWith.includes(userId)) {
      return { success: false, error: 'Al gedeeld met deze gebruiker' };
    }

    sharedWith.push(userId);

    await adminDb.collection('wishlists').doc(wishlistId).update({
      sharedWith,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('shareWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet delen',
    };
  }
}

/**
 * ✅ Unshare wishlist
 */
export async function unshareWishlistAction(
  wishlistId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();

    if (!doc.exists) {
      return { success: false, error: 'Wishlist niet gevonden' };
    }

    const wishlistData = doc.data();
    const sharedWith = wishlistData?.sharedWith || [];

    const filteredSharedWith = sharedWith.filter((id: string) => id !== userId);

    await adminDb.collection('wishlists').doc(wishlistId).update({
      sharedWith: filteredSharedWith,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('unshareWishlistAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon delen niet verwijderen',
    };
  }
}

// ============================================================================
// BACKGROUND & CUSTOMIZATION
// ============================================================================

/**
 * ✅ Update wishlist background
 */
export async function updateWishlistBackgroundAction(
  wishlistId: string,
  backgroundImage: string
): Promise<ActionResult> {
  try {
    await adminDb.collection('wishlists').doc(wishlistId).update({
      backgroundImage,
      updatedAt: nowTimestamp(), // ✅ Already correct
    });

    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();
    const slug = doc.data()?.slug;

    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('updateWishlistBackgroundAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon achtergrond niet bijwerken',
    };
  }
}

/**
 * ✅ Get all background images for wishlists
 */
export async function getBackgroundImagesAction(): Promise<ActionResult<any[]>> {
  try {
    const snapshot = await adminDb.collection('WishlistBackImages').get();

    const images = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: images };
  } catch (error) {
    console.error('getBackgroundImagesAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon achtergronden niet ophalen',
    };
  }
}

/**
 * ✅ Get background categories
 */
export async function getBackgroundCategoriesAction(): Promise<ActionResult<any[]>> {
  try {
    const snapshot = await adminDb.collection('backgroundCategories').get();

    const categories = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((cat: any) => cat.type === 'wishlist');

    return { success: true, data: categories };
  } catch (error) {
    console.error('getBackgroundCategoriesAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon categorieën niet ophalen',
    };
  }
}

// ============================================================================
// DASHBOARD STATS (voor dashboard overview)
// ============================================================================

export type WishlistStats = {
  total: number;
  public: number;
  private: number;
};

/**
 * ✅ Haalt wishlist statistieken op voor een specifieke user of profile
 * Gebruikt voor dashboard overview cards
 */
export async function getWishlistStatsForUser(
  userId: string,
  isProfile: boolean = false
): Promise<WishlistStats> {
  try {
    const wishlistsRef = adminDb.collection('wishlists');
    
    // Query afhankelijk van of het een profile of user is
    const query = isProfile
      ? wishlistsRef.where('profileId', '==', userId)
      : wishlistsRef.where('userId', '==', userId).where('profileId', '==', null);

    const snapshot = await query.get();
    
    let publicCount = 0;
    let privateCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.isPrivate || !data.isPublic) {
        privateCount++;
      } else {
        publicCount++;
      }
    });

    return {
      total: snapshot.size,
      public: publicCount,
      private: privateCount,
    };
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    return {
      total: 0,
      public: 0,
      private: 0,
    };
  }
}
// ============================================================================
// EVENT LINKING OPERATIONS (✅ NIEUW!)
// ============================================================================

/**
 * ✅ Link wishlist to event participant
 */
export async function linkWishlistToEventAction({
  eventId,
  wishlistId,
  participantId,
}: {
  eventId: string;
  wishlistId: string;
  participantId: string;
}): Promise<ActionResult> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden' };
    }
    
    const eventData = eventDoc.data();
    const participants = eventData?.participants || {};
    
    // Find participant (can be by key or by id in value)
    let participantKey: string | null = null;
    
    // Check if participantId is a direct key
    if (participants[participantId]) {
      participantKey = participantId;
    } else {
      // Search by id in participant objects
      for (const [key, participant] of Object.entries(participants)) {
        if ((participant as any).id === participantId) {
          participantKey = key;
          break;
        }
      }
    }
    
    if (!participantKey) {
      return { success: false, error: 'Deelnemer niet gevonden in event' };
    }
    
    // Update participant with wishlistId
    participants[participantKey] = {
      ...participants[participantKey],
      wishlistId,
    };
    
    await eventRef.update({ 
      participants,
      updatedAt: nowTimestamp(),
    });
    
    // Revalidate paths
    revalidatePath(`/dashboard/event/${eventId}`);
    revalidatePath('/dashboard/wishlists');
    
    return { success: true };
  } catch (error) {
    console.error('linkWishlistToEventAction error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon wishlist niet koppelen aan event' 
    };
  }
}