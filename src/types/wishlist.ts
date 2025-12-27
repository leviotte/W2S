// src/types/wishlist.ts
import { z } from 'zod';
import { productSchema, type Product } from './product';

export const claimedBySchema = z.object({
  userId: z.string(),
  userName: z.string(),
  quantity: z.number().optional().default(1),
  claimedAt: z.string().optional(),
});
export type ClaimedBy = z.infer<typeof claimedBySchema>;

export const wishlistItemSchema = productSchema.extend({
  id: z.union([z.string(), z.number()]),
  productId: z.union([z.string(), z.number()]).optional(),
  quantity: z.number().min(1).default(1),
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
  claimedBy: claimedBySchema.optional().nullable(),
  addedAt: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
  purchasedBy: z.string().optional().nullable(),    // userId van koper (enkel)
  multiPurchasedBy: z.record(z.string(), z.array(z.string())).optional(), // {eventId: [userId, ...]}
  purchasedAt: z.string().optional().nullable(),    // ISO-string aankoopdatum
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "De naam van de wishlist moet minstens 3 tekens lang zijn."),
  userId: z.string(),
  ownerId: z.string().optional(),
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
// HELPER FUNCTIONS - PURCHASE TRACKING (SIMPELE VARIANT!)
// ============================================================================

/**
 * Check of een item gekocht is (maakt niet uit door wie)
 */
export function isItemPurchased(item: WishlistItem): boolean {
  return !!item.purchasedBy;
}

/**
 * Check of dit item is gekocht door een specifieke (huidige) gebruiker
 */
export function isItemPurchasedByUser(
  item: WishlistItem,
  userId: string
): boolean {
  return item.purchasedBy === userId;
}
export function hasParticipantPurchasedForEvent(
  item: WishlistItem,
  eventId: string,
  participantId: string
): boolean {
  // NIEUW: Multi-event check
  return !!item.multiPurchasedBy?.[eventId]?.includes(participantId);
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

export function calculatePurchasedPrice(wishlist: Wishlist): number {
  return wishlist.items
    .filter(isItemPurchased)
    .reduce((total, item) => total + item.price * item.quantity, 0);
}

// ============================================================================
// HELPER FUNCTIONS - SORTING & FILTERING
// ============================================================================

export function sortByPriority(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getAvailableItems(wishlist: Wishlist): WishlistItem[] {
  return wishlist.items.filter(item => !isItemReserved(item) && !isItemPurchased(item));
}

export function getItemsReservedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isReservedByUser(item, userId));
}

export function getItemsPurchasedByUser(
  wishlist: Wishlist,
  userId: string
): WishlistItem[] {
  return wishlist.items.filter(item => isItemPurchasedByUser(item, userId));
}

// ============================================================================
// HELPER FUNCTIONS - PROFILE FILTERING
// ============================================================================

export function getMainUserWishlists(wishlists: Wishlist[]): Wishlist[] {
  return wishlists.filter(w => !w.profileId);
}

export function getProfileWishlists(wishlists: Wishlist[], profileId: string): Wishlist[] {
  return wishlists.filter(w => w.profileId === profileId);
}

export function isMainUserWishlist(wishlist: Wishlist): boolean {
  return !wishlist.profileId;
}

export interface UpdateWishlistItemData {
  wishlistId: string;
  itemId: string;
  updates: Partial<WishlistItem>;
}
export function assertIsWishlistItem(item: unknown): asserts item is WishlistItem {}