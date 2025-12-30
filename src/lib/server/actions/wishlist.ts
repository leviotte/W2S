// src/lib/server/actions/wishlist.ts
'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';
import { nowTimestamp } from '@/lib/utils/time';
import { getSession } from '@/lib/auth/session.server';
import type { UserProfile } from '@/types/user';
import type { BackgroundCategory, BackgroundImage } from '@/types/background';
import type { Wishlist, WishlistItem, UpdateWishlistItemData, CreateWishlistData } from '@/types/wishlist';
import {
  serializeWishlist,
  serializeWishlistItem,
  serializeUserProfile,
} from '@/lib/utils/serializers';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { [field: string]: string[] };
  message?: string;
}

// ============================================================================
// CREATE / UPDATE WISHLIST
// ============================================================================

export async function createWishlistAction({
  userId,
  data,
}: { userId: string; data: CreateWishlistData }): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const slugBase = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingSnapshot = await adminDb
      .collection('wishlists')
      .where('slug', '==', slugBase)
      .limit(1)
      .get();

    const finalSlug = existingSnapshot.empty ? slugBase : `${slugBase}-${Date.now()}`;

    const wishlistData: Wishlist = {
      id: '', // Firestore auto-ID
      userId,
      ownerId: userId,
      ownerName: data.ownerName,
      name: data.name,
      description: data.description ?? undefined,
      isPublic: data.isPublic ?? false,
      backgroundImage: data.backgroundImage ?? undefined,
      items: data.items ?? [],
      sharedWith: [],
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      profileId: data.profileId ?? undefined,
      eventId: data.eventId ?? undefined,
      participantId: data.participantId ?? undefined,
      slug: finalSlug,
      tags: data.tags ?? [],
      category: data.category ?? undefined,
      minPrice: data.minPrice ?? 0,
      maxPrice: data.maxPrice ?? 0,
      participantIds: data.participantIds ?? [userId],
    };

    const docRef = await adminDb.collection('wishlists').add(wishlistData);

    // Event linking
    if (data.eventId && data.participantId) {
      await linkWishlistToEventAction({
        eventId: data.eventId,
        wishlistId: docRef.id,
        participantId: data.participantId,
      });
    }

    revalidatePath('/dashboard/wishlists');
    revalidatePath(`/wishlist/${finalSlug}`);

    return { success: true, data: { id: docRef.id, slug: finalSlug } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet aanmaken',
    };
  }
}

export async function updateWishlistAction(
  wishlistId: string,
  updates: Partial<Wishlist>
): Promise<ActionResult> {
  try {
    await adminDb.collection('wishlists').doc(wishlistId).update({
      ...updates,
      updatedAt: nowTimestamp(),
    });

    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();
    const slug = doc.data()?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) revalidatePath(`/wishlist/${slug}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet bijwerken',
    };
  }
}

export async function deleteWishlistAction(wishlistId: string): Promise<ActionResult> {
  try {
    const doc = await adminDb.collection('wishlists').doc(wishlistId).get();
    const slug = doc.data()?.slug;

    await adminDb.collection('wishlists').doc(wishlistId).delete();

    revalidatePath('/dashboard/wishlists');
    if (slug) revalidatePath(`/wishlist/${slug}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kon wishlist niet verwijderen',
    };
  }
}

// ============================================================================
// WISHLIST ITEMS
// ============================================================================

export async function addItemToWishlistAction(
  wishlistId: string,
  item: Partial<WishlistItem>
): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const items = wishlistData.items ?? [];

    const existingIndex = items.findIndex((i) => String(i.id) === String(item.id));

    let updatedItems: WishlistItem[];
    let message = 'Item toegevoegd';

    if (existingIndex !== -1) {
      updatedItems = items.map((i, idx) =>
        idx === existingIndex
          ? {
              ...i,
              quantity: (i.quantity ?? 1) + (item.quantity ?? 1),
              price: item.price ?? i.price,
              imageUrl: item.imageUrl ?? i.imageUrl,
              updatedAt: nowTimestamp(),
            }
          : i
      );
      message = 'Aantal verhoogd';
    } else {
      const newItem: WishlistItem = {
        source: item.source ?? 'Internal',
        id: item.id!,
        productId: item.productId ?? item.id!,
        title: item.title ?? '',
        description: item.description ?? '',
        url: item.url ?? '',
        imageUrl: item.imageUrl ?? '',
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
        isReserved: false,
        isPurchased: false,
        platforms: item.platforms ?? {},
        addedAt: nowTimestamp(),
        updatedAt: nowTimestamp(),
      };
      updatedItems = [...items, newItem];
    }

    await docRef.update({ items: updatedItems, updatedAt: nowTimestamp() });

    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true, message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon item niet toevoegen' };
  }
}

export async function updateWishlistItemAction({
  wishlistId,
  itemId,
  updates,
}: UpdateWishlistItemData): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const items = wishlistData.items ?? [];

    const index = items.findIndex((i) => String(i.id) === String(itemId));
    if (index === -1) return { success: false, error: 'Item niet gevonden' };

    items[index] = { ...items[index], ...updates, updatedAt: nowTimestamp() };

    await docRef.update({ items, updatedAt: nowTimestamp() });

    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon item niet bijwerken' };
  }
}

export async function deleteWishlistItemAction(wishlistId: string, itemId: string): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const updatedItems = (wishlistData.items ?? []).filter((i) => String(i.id) !== String(itemId));

    await docRef.update({ items: updatedItems, updatedAt: nowTimestamp() });

    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon item niet verwijderen' };
  }
}

// ============================================================================
// RESERVATIONS & PURCHASE
// ============================================================================

export async function reserveItemAction(
  wishlistId: string,
  itemId: string,
  userId: string,
  userName: string
): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const items = wishlistData.items ?? [];
    const index = items.findIndex((i) => String(i.id) === String(itemId));
    if (index === -1) return { success: false, error: 'Item niet gevonden' };
    if (items[index].isReserved) return { success: false, error: 'Item is al gereserveerd' };

    items[index] = {
      ...items[index],
      isReserved: true,
      reservedBy: userId,
      reservedByName: userName,
      updatedAt: nowTimestamp(),
    };

    await docRef.update({ items, updatedAt: nowTimestamp() });
    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon item niet reserveren' };
  }
}

export async function markItemPurchasedAction(
  wishlistId: string,
  itemId: string,
  purchasedBy: string
): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const items = wishlistData.items ?? [];
    const index = items.findIndex((i) => String(i.id) === String(itemId));
    if (index === -1) return { success: false, error: 'Item niet gevonden' };

    items[index] = {
      ...items[index],
      isPurchased: true,
      purchasedBy,
      updatedAt: nowTimestamp(),
    };

    await docRef.update({ items, updatedAt: nowTimestamp() });
    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon aankoop niet registreren' };
  }
}

// ============================================================================
// EVENT LINKING
// ============================================================================

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
    await eventRef.set(
      {
        wishlists: { [participantId]: wishlistId }, // overschrijft altijd
        updatedAt: nowTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('linkWishlistToEventAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Kon wishlist niet koppelen' };
  }
}

export async function getWishlistsByOwnerId(
  ownerId: string
): Promise<{ success: true; data: Wishlist[] } | { success: false; error: string }> {
  try {
    const snapshot = await adminDb
      .collection('wishlists')
      .where('userId', '==', ownerId)
      .get();

    const wishlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Wishlist[];

    return { success: true, data: wishlists };
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return { success: false, error: 'Kon wishlists niet ophalen.' };
  }
}
export async function updateWishlistBackgroundAction(
  wishlistId: string,
  backgroundImage: string
): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    await docRef.update({ backgroundImage, updatedAt: nowTimestamp() });

    const doc = await docRef.get();
    const slug = doc.data()?.slug;
    revalidatePath(`/wishlist/${slug}`);
    revalidatePath('/dashboard/wishlists');

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon achtergrond niet bijwerken' };
  }
}
export async function getBackgroundImagesAction(): Promise<ActionResult<BackgroundImage[]>> {
  try {
    const snapshot = await adminDb.collection('backgroundImages').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BackgroundImage[];
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon achtergrondafbeeldingen niet ophalen' };
  }
}

export async function getBackgroundCategoriesAction(): Promise<ActionResult<BackgroundCategory[]>> {
  try {
    const snapshot = await adminDb.collection('backgroundCategories').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BackgroundCategory[];
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon achtergrondcategorieën niet ophalen' };
  }
}
export async function undoPurchaseWishlistItemAction(wishlistId: string, itemId: string): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    const wishlistData = docSnap.data() as Wishlist;
    const items = wishlistData.items ?? [];
    const index = items.findIndex((i) => String(i.id) === String(itemId));
    if (index === -1) return { success: false, error: 'Item niet gevonden' };

    items[index] = {
      ...items[index],
      isPurchased: false,
      purchasedBy: undefined,
      updatedAt: nowTimestamp(),
    };

    await docRef.update({ items, updatedAt: nowTimestamp() });
    revalidatePath('/dashboard/wishlists');
    if (wishlistData.slug) revalidatePath(`/wishlist/${wishlistData.slug}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kon aankoop niet ongedaan maken' };
  }
}
export async function toggleWishlistPrivacyAction(
  wishlistId: string,
  makePublic: boolean
): Promise<ActionResult> {
  try {
    const docRef = adminDb.collection('wishlists').doc(wishlistId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return { success: false, error: 'Wishlist niet gevonden' };

    await docRef.update({
      isPublic: makePublic,
      updatedAt: nowTimestamp(),
    });

    const slug = docSnap.data()?.slug;
    revalidatePath('/dashboard/wishlists');
    if (slug) revalidatePath(`/wishlist/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('toggleWishlistPrivacyAction error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Kon privacy niet wijzigen' };
  }
}