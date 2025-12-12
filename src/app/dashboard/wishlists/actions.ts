// src/app/dashboard/wishlists/actions.ts
'use server';

/**
 * ✅ RE-EXPORT FILE
 * Deze file exporteert alle wishlist actions vanuit de centrale locatie.
 * Dit behoudt backwards compatibility voor bestaande imports.
 */

// ============================================================================
// EXPORT CENTRALE WISHLIST ACTIONS
// ============================================================================

export {
  getUserWishlistsAction,
  getWishlistByIdAction,
  getWishlistBySlugAction,
  createWishlistAction, // ✅ Direct callable versie
  updateWishlistAction,
  deleteWishlistAction,
  addItemToWishlistAction,
  removeItemFromWishlistAction,
  updateWishlistItemAction,
  reserveItemAction,
  unreserveItemAction,
  shareWishlistAction,
  unshareWishlistAction,
} from '@/lib/server/actions/wishlist-actions';

// ============================================================================
// EXPORT FORM ACTIONS (uit create folder)
// ============================================================================

export {
  createWishlistFormAction, // ✅ Form versie met useFormState
  type CreateWishlistFormState,
} from './create/actions';

// ============================================================================
// BACKWARDS COMPATIBILITY ALIASES
// ============================================================================

import { 
  getUserWishlistsAction,
  getWishlistByIdAction,
} from '@/lib/server/actions/wishlist-actions';

// Alias voor oude code
export const loadWishlistsAction = getUserWishlistsAction;
export const getWishlistAction = getWishlistByIdAction;

// ============================================================================
// EVENT-SPECIFIC ACTIONS
// ============================================================================

import { adminDb } from '@/lib/server/firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * ✅ Link een wishlist aan een event participant
 */
export async function linkWishlistToEventAction(
  eventId: string,
  wishlistId: string,
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return { success: false, error: 'Event niet gevonden' };
    }

    const eventData = eventDoc.data();
    const participants = eventData?.participants || {};

    if (participants[participantId]) {
      participants[participantId].wishlistId = wishlistId;

      await eventRef.update({
        participants,
        updatedAt: new Date().toISOString(),
      });

      revalidatePath(`/dashboard/event/${eventId}`);
      revalidatePath(`/event/${eventId}`);

      return { success: true };
    }

    return { success: false, error: 'Participant niet gevonden' };
  } catch (error) {
    console.error('Error linking wishlist to event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het linken van de wishlist' 
    };
  }
}

/**
 * ✅ Legacy action voor toggle reserved (deprecated - gebruik de nieuwe actions)
 */
export async function toggleItemReservedAction(
  wishlistId: string,
  itemId: string | number,
  reservedBy?: string | null
) {
  const { reserveItemAction, unreserveItemAction } = await import('@/lib/server/actions/wishlist-actions');
  
  if (reservedBy) {
    return await reserveItemAction(wishlistId, String(itemId), reservedBy, 'Unknown User');
  } else {
    return { success: false, error: 'Use reserveItemAction or unreserveItemAction instead' };
  }
}