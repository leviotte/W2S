// src/types/wishlist.ts
import { z } from 'zod';
import { productSchema, type Product } from './product';

export const claimedBySchema = z.object({
  userId: z.string(),
  userName: z.string(),
  quantity: z.number().optional().default(1),
  claimedAt: z.string().optional(), // ISO timestamp
});
export type ClaimedBy = z.infer<typeof claimedBySchema>;

export const wishlistItemSchema = productSchema.extend({
  id: z.union([z.string(), z.number()]),
  productId: z.union([z.string(), z.number()]).optional(),
  quantity: z.number().min(1).default(1),
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
  claimedBy: claimedBySchema.optional().nullable(),
  purchasedBy: z.record(z.string(), z.array(z.string())).optional().nullable(),
  addedAt: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "De naam van de wishlist moet minstens 3 tekens lang zijn."),
  ownerId: z.string(),
  ownerName: z.string().optional(),
  isPublic: z.boolean().default(false),
  description: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  backgroundImage: z.string().url().optional().nullable(),
  items: z.array(wishlistItemSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sharedWith: z.array(z.string()).optional(),
  profileId: z.string().optional().nullable(),
});
export type Wishlist = z.infer<typeof wishlistSchema>;


// ============================================================================
// HELPER FUNCTIONS - RESERVATION
// ============================================================================

export function isItemReserved(item: WishlistItem): boolean {
  return item.isReserved || !!item.reservedBy || !!item.claimedBy;
}

export function isReservedByUser(item: WishlistItem, userId: string): boolean {
  return item.reservedBy === userId || item.claimedBy?.userId === userId;
}

export function countReservedItems(wishlist: Wishlist): number {
  return wishlist.items.filter(isItemReserved).length;
}

export function countAvailableItems(wishlist: Wishlist): number {
  return wishlist.items.filter(item => !isItemReserved(item)).length;
}

// ============================================================================
// HELPER FUNCTIONS - PURCHASE TRACKING
// ============================================================================

/**
 * Check if an item is purchased by ANY user for a specific event
 */
export function isItemPurchasedForEvent(item: WishlistItem, eventId: string): boolean {
  if (!item.purchasedBy) return false;
  const purchasers = item.purchasedBy[eventId];
  return purchasers && purchasers.length > 0;
}

/**
 * Check if an item is purchased by a SPECIFIC user for a specific event
 */
export function isItemPurchasedByUserForEvent(
  item: WishlistItem, 
  userId: string, 
  eventId: string
): boolean {
  if (!item.purchasedBy) return false;
  const purchasers = item.purchasedBy[eventId];
  return purchasers ? purchasers.includes(userId) : false;
}

/**
 * Get all user IDs who purchased an item for a specific event
 */
export function getPurchasersForEvent(item: WishlistItem, eventId: string): string[] {
  if (!item.purchasedBy) return [];
  return item.purchasedBy[eventId] || [];
}

/**
 * Count how many items a user has purchased for a specific event across ALL wishlists
 */
export function countItemsPurchasedByUserForEvent(
  wishlists: Wishlist[], 
  userId: string, 
  eventId: string
): number {
  let count = 0;
  
  for (const wishlist of wishlists) {
    for (const item of wishlist.items) {
      if (isItemPurchasedByUserForEvent(item, userId, eventId)) {
        count++;
      }
    }
  }
  
  return count;
}

// ============================================================================
// HELPER FUNCTIONS - PRICE CALCULATION
// ============================================================================

export function calculateTotalPrice(wishlist: Wishlist): number {
  return wishlist.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculateReservedPrice(wishlist: Wishlist): number {
  return wishlist.items
    .filter(isItemReserved)
    .reduce((total, item) => total + item.price * item.quantity, 0);
}

export function calculatePurchasedPriceForEvent(wishlist: Wishlist, eventId: string): number {
  return wishlist.items
    .filter(item => isItemPurchasedForEvent(item, eventId))
    .reduce((total, item) => total + item.price * item.quantity, 0);
}

// ============================================================================
// HELPER FUNCTIONS - SORTING & FILTERING
// ============================================================================

export function sortByPriority(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getAvailableItems(wishlist: Wishlist): WishlistItem[] {
  return wishlist.items.filter(item => !isItemReserved(item));
}

export function getItemsReservedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isReservedByUser(item, userId));
}

export function getItemsPurchasedByUserForEvent(
  wishlist: Wishlist, 
  userId: string, 
  eventId: string
): WishlistItem[] {
  return wishlist.items.filter(item => 
    isItemPurchasedByUserForEvent(item, userId, eventId)
  );
}

// ============================================================================
// HELPER FUNCTIONS - PROFILE FILTERING
// ============================================================================

/**
 * ✅ Filter wishlists voor MAIN USER (geen sub-profiles)
 */
export function getMainUserWishlists(wishlists: Wishlist[]): Wishlist[] {
  return wishlists.filter(w => !w.profileId);
}

/**
 * ✅ Filter wishlists voor SPECIFIC PROFILE
 */
export function getProfileWishlists(wishlists: Wishlist[], profileId: string): Wishlist[] {
  return wishlists.filter(w => w.profileId === profileId);
}

/**
 * ✅ Check of wishlist bij main user hoort
 */
export function isMainUserWishlist(wishlist: Wishlist): boolean {
  return !wishlist.profileId;
}