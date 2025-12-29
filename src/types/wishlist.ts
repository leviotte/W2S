// src/types/wishlist.ts
import { z } from 'zod';
import { productSchema } from './product';

/** 👤 ClaimedBy */
export const claimedBySchema = z.object({
  userId: z.string(),
  userName: z.string(),
  quantity: z.number().optional().default(1),
  claimedAt: z.string().optional(),
});
export type ClaimedBy = z.infer<typeof claimedBySchema>;

/** 📝 Wishlist Item */
export const wishlistItemSchema = productSchema.extend({
  id: z.union([z.string(), z.number()]),
  productId: z.union([z.string(), z.number()]).optional(),
  title: z.string().default(''),
  description: z.string().optional().nullable(),
  url: z.string().default(''),
  imageUrl: z.string().default(''),
  price: z.number().default(0),
  quantity: z.number().min(1).default(1),
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
  reservedByName: z.string().optional().nullable(),
  claimedBy: claimedBySchema.optional().nullable(),
  addedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
  isPurchased: z.boolean().default(false),
  purchasedBy: z.string().optional().nullable(),
  purchasedAt: z.string().optional().nullable(),
  multiPurchasedBy: z.record(z.string(), z.array(z.string())).optional(),
  platforms: z.record(z.string(), z.object({ URL: z.string(), Price: z.number(), Source: z.string() })).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

/** 📂 Wishlist */
export const wishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  userId: z.string(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  participantId: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
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
  eventId: z.string().optional(),
});
export type Wishlist = z.infer<typeof wishlistSchema>;

/** ================================
 * HELPER FUNCTIONS - RESERVATION & PURCHASE
 * ================================ */

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

export function isItemPurchased(item: WishlistItem): boolean {
  return !!item.isPurchased || !!item.purchasedBy;
}

export function isItemPurchasedByUser(item: WishlistItem, userId: string): boolean {
  return item.purchasedBy === userId;
}

export function hasParticipantPurchasedForEvent(
  item: WishlistItem,
  eventId: string,
  participantId: string
): boolean {
  return !!item.multiPurchasedBy?.[eventId]?.includes(participantId);
}

export function calculateTotalPrice(wishlist: Wishlist): number {
  return wishlist.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateReservedPrice(wishlist: Wishlist): number {
  return wishlist.items.filter(isItemReserved).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculatePurchasedPrice(wishlist: Wishlist): number {
  return wishlist.items.filter(isItemPurchased).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function sortByPriority(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function getAvailableItems(wishlist: Wishlist): WishlistItem[] {
  return wishlist.items.filter(item => !isItemReserved(item) && !isItemPurchased(item));
}

export function getItemsReservedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isReservedByUser(item, userId));
}

export function getItemsPurchasedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isItemPurchasedByUser(item, userId));
}

export function getMainUserWishlists(wishlists: Wishlist[]): Wishlist[] {
  return wishlists.filter(w => !w.profileId);
}

export function getProfileWishlists(wishlists: Wishlist[], profileId: string): Wishlist[] {
  return wishlists.filter(w => w.profileId === profileId);
}

export function isMainUserWishlist(wishlist: Wishlist): boolean {
  return !wishlist.profileId;
}

/** ================================
 * ACTION INTERFACES
 * ================================ */
export interface UpdateWishlistItemData {
  wishlistId: string;
  itemId: string;
  updates: Partial<WishlistItem>;
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
  eventId?: string;
  participantId?: string;
}
