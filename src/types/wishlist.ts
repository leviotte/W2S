// src/types/wishlist.ts
import { z } from 'zod';
import { productSchema, type Product } from './product';

// ============================================================================
// CLAIMED BY SCHEMA
// ============================================================================

export const claimedBySchema = z.object({
  userId: z.string(),
  userName: z.string(),
  quantity: z.number().optional().default(1),
  claimedAt: z.string().optional(), // ISO timestamp
});

export type ClaimedBy = z.infer<typeof claimedBySchema>;

// ============================================================================
// WISHLIST ITEM SCHEMA
// ============================================================================

/**
 * WishlistItem = Product + reservation/wishlist metadata
 */
export const wishlistItemSchema = productSchema.extend({
  quantity: z.number().min(1).default(1), // ✅ TOEGEVOEGD!
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
  claimedBy: claimedBySchema.optional().nullable(),
  addedAt: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

// Rest van de file blijft hetzelfde...
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
});

export type Wishlist = z.infer<typeof wishlistSchema>;

// ============================================================================
// HELPER FUNCTIONS (blijven hetzelfde)
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

export function calculateTotalPrice(wishlist: Wishlist): number {
  return wishlist.items.reduce((total, item) => total + item.price, 0);
}

export function calculateReservedPrice(wishlist: Wishlist): number {
  return wishlist.items
    .filter(isItemReserved)
    .reduce((total, item) => total + item.price, 0);
}

export function sortByPriority(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

export function getAvailableItems(wishlist: Wishlist): WishlistItem[] {
  return wishlist.items.filter(item => !isItemReserved(item));
}

export function getItemsReservedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isReservedByUser(item, userId));
}

export function productToWishlistItem(product: Product): WishlistItem {
  return {
    ...product,
    quantity: 1, // ✅ TOEGEVOEGD!
    isReserved: false,
    reservedBy: null,
    claimedBy: null,
    addedAt: new Date().toISOString(),
  };
}
