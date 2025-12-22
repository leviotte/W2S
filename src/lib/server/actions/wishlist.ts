// src/lib/server/actions/wishlist.ts
'use server';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Wishlist, WishlistItem } from '@/types/wishlist';
import { toDate, nowTimestamp } from '@/lib/utils/time';
import type { UserProfile } from '@/types/user';

// ----------------------------------------
// TYPES & INTERFACES
// ----------------------------------------
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { [field: string]: string[] };
  message?: string;
}


export interface CreateWishlistData {
  name: string;
  description?: string;
  isPublic?: boolean;
  backgroundImage?: string;
  minPrice?: number;
  maxPrice?: number;
  ownerName?: string;
  participantIds?: string[];
  items?: WishlistItem[];
  profileId?: string | null;
  tags?: string[];
  category?: string | null;
}
export interface UpdateWishlistData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  backgroundImage?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  category?: string | null;
  profileId?: string | null;
  // Voeg hier velden toe die updatable zijn
}

export interface UpdateWishlistItemData {
  wishlistId: string;
  itemId: string;
  updates: Partial<WishlistItem>;
}
// ----------------------------------------
// WISHLIST CRUD OPERATIONS
// ----------------------------------------
export async function getUserWishlistsAction(userId: string): Promise<ActionResult<Wishlist[]>> {
  try {
    const wishlistsSnapshot = await adminDb
      .collection('wishlists')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const wishlists = wishlistsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: toDate(data.updatedAt).toISOString(),
      } as Wishlist;
    });
    return { success: true, data: wishlists };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlists niet ophalen',
    };
  }
}

// ----------------------------------------
// ENIGE centrale CREATE functie
// ----------------------------------------
export async function createWishlistAction(
  userId: string,
  data: CreateWishlistData
): Promise<ActionResult<string>> {
  try {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
      ownerId: userId,  // ZET ALTIJD BEIDEN (legacy én toekomst)
      ownerName: data.ownerName || '',
      participantIds: data.participantIds || [userId],
      items: Array.isArray(data.items) ? data.items : [],
      slug: finalSlug,
      isPublic: data.isPublic ?? false,
      backgroundImage: data.backgroundImage || '',
      minPrice: data.minPrice || 0,
      maxPrice: data.maxPrice || 0,
      sharedWith: [],
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      profileId: data.profileId ?? null,
      tags: data.tags || [],
      category: data.category || null,
    };

    const docRef = await adminDb.collection('wishlists').add(wishlistData);
    revalidatePath('/dashboard/wishlists');
    revalidatePath(`/wishlist/${finalSlug}`);
    return { success: true, data: docRef.id };
  } catch (error) {
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
      updatedAt: nowTimestamp(),
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
 * ✅ Add item to wishlist - FIXED met quantity-based deduplication
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

    // ✅ CHECK: Bestaat dit product al? (match op id = EAN/ASIN)
    const existingItemIndex = items.findIndex(
      (existing: WishlistItem) => String(existing.id) === String(item.id)
    );

    let updatedItems;
    let message = 'Item toegevoegd';

    if (existingItemIndex !== -1) {
      // ✅ Product bestaat al → verhoog quantity
      updatedItems = items.map((existing: WishlistItem, index: number) => {
        if (index === existingItemIndex) {
          return {
            ...existing,
            quantity: (existing.quantity || 1) + (item.quantity || 1),
            // ✅ Update prijs/afbeelding voor het geval die gewijzigd zijn
            price: item.price ?? existing.price,
            imageUrl: item.imageUrl ?? existing.imageUrl,
            updatedAt: nowTimestamp(),
          };
        }
        return existing;
      });
      message = 'Aantal verhoogd';
    } else {
      // ✅ Nieuw product → voeg toe
      const newItem = {
        ...item,
        id: item.id, // ✅ Gebruik EAN/ASIN als ID
        productId: item.productId || item.id,
        title: item.title || '',
        description: item.description || '',
        url: item.url || '',
        imageUrl: item.imageUrl || (item as any).image || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        isReserved: false,
        source: item.source || 'Internal',
        platforms: item.platforms || {},
        addedAt: nowTimestamp(),
        updatedAt: nowTimestamp(),
      };

      updatedItems = [...items, newItem];
    }

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items: updatedItems,
      updatedAt: nowTimestamp(),
    });

    const slug = wishlistData?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) {
      revalidatePath(`/wishlist/${slug}`);
    }

    return { success: true, message };
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
      updatedAt: nowTimestamp(),
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(),
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
      updatedAt: nowTimestamp(),
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
      reservedAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(),
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
      updatedAt: nowTimestamp(),
    };

    await adminDb.collection('wishlists').doc(wishlistId).update({
      items,
      updatedAt: nowTimestamp(),
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
      updatedAt: nowTimestamp(),
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
      updatedAt: nowTimestamp(),
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
      updatedAt: nowTimestamp(),
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
// EVENT LINKING OPERATIONS
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
export async function getWishlistBySlugAction(slug: string): Promise<{ success: boolean; data?: Wishlist | null; error?: string; }> {
  try {
    const snapshot = await adminDb
      .collection('wishlists')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return { success: false, data: null, error: 'Niet gevonden' };
    }
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } as Wishlist };
  } catch (err) {
    return { success: false, data: null, error: (err as Error).message };
  }
}
export async function getWishlistOwnerAction(userId: string): Promise<{ success: boolean; data?: UserProfile | null; error?: string; }> {
  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) {
      return { success: false, data: null, error: 'Gebruiker niet gevonden' };
    }
    return { success: true, data: { id: doc.id, ...doc.data() } as UserProfile };
  } catch (err) {
    return { success: false, data: null, error: (err as Error).message };
  }
}
export async function toggleWishlistPrivacyAction(
  wishlistId: string,
  isPrivate: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Niet geautoriseerd' };

    const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();
    if (!wishlistDoc.exists) return { success: false, error: 'Wishlist niet gevonden' };
    const wishlistData = wishlistDoc.data();

    if (wishlistData?.ownerId !== session.user.id) {
      return { success: false, error: 'Niet geautoriseerd om deze wishlist te wijzigen' };
    }

    await adminDb.collection('wishlists').doc(wishlistId).update({
      isPublic: !isPrivate,
      updatedAt: nowTimestamp(),
    });

    revalidatePath('/dashboard/wishlists');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon privacy niet wijzigen',
    };
  }
}