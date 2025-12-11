// src/types/wishlist.ts
import { z } from 'zod';
import { productSchema, type Product } from './product'; // ✅ IMPORT

/**
 * ✅ SINGLE SOURCE OF TRUTH voor Wishlist en WishlistItem
 * WishlistItem = Product + wishlist-specifieke metadata
 */

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
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(), // userId van wie het gereserveerd heeft
  claimedBy: claimedBySchema.optional().nullable(), // Volledige claim info
  addedAt: z.string().optional(), // Wanneer toegevoegd aan wishlist
  priority: z.number().optional(), // 1 = hoogste prioriteit
  notes: z.string().optional(), // Persoonlijke notities van de wishlist eigenaar
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

// ============================================================================
// WISHLIST SCHEMA
// ============================================================================

export const wishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "De naam van de wishlist moet minstens 3 tekens lang zijn."),
  ownerId: z.string(),
  ownerName: z.string().optional(), // Voor display purposes
  
  isPublic: z.boolean().default(false),
  description: z.string().optional().nullable(),
  slug: z.string().optional().nullable(), // Voor custom URLs
  
  eventDate: z.string().optional().nullable(), // ISO date string
  backgroundImage: z.string().url().optional().nullable(),
  
  items: z.array(wishlistItemSchema).default([]),
  
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  
  // Metadata
  category: z.string().optional(), // 'birthday', 'wedding', 'baby', etc.
  tags: z.array(z.string()).optional(),
  sharedWith: z.array(z.string()).optional(), // User IDs met wie gedeeld
});

export type Wishlist = z.infer<typeof wishlistSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check of een item gereserveerd is
 */
export function isItemReserved(item: WishlistItem): boolean {
  return item.isReserved || !!item.reservedBy || !!item.claimedBy;
}

/**
 * Check of een specifieke gebruiker een item gereserveerd heeft
 */
export function isReservedByUser(item: WishlistItem, userId: string): boolean {
  return item.reservedBy === userId || item.claimedBy?.userId === userId;
}

/**
 * Tel het aantal gereserveerde items in een wishlist
 */
export function countReservedItems(wishlist: Wishlist): number {
  return wishlist.items.filter(isItemReserved).length;
}

/**
 * Tel het aantal beschikbare items in een wishlist
 */
export function countAvailableItems(wishlist: Wishlist): number {
  return wishlist.items.filter(item => !isItemReserved(item)).length;
}

/**
 * Bereken totaalprijs van wishlist
 */
export function calculateTotalPrice(wishlist: Wishlist): number {
  return wishlist.items.reduce((total, item) => total + item.price, 0);
}

/**
 * Bereken totaalprijs van gereserveerde items
 */
export function calculateReservedPrice(wishlist: Wishlist): number {
  return wishlist.items
    .filter(isItemReserved)
    .reduce((total, item) => total + item.price, 0);
}

/**
 * Sorteer items op prioriteit (hoogste eerst)
 */
export function sortByPriority(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Filter items op beschikbaarheid
 */
export function getAvailableItems(wishlist: Wishlist): WishlistItem[] {
  return wishlist.items.filter(item => !isItemReserved(item));
}

/**
 * Filter items gereserveerd door een specifieke gebruiker
 */
export function getItemsReservedByUser(wishlist: Wishlist, userId: string): WishlistItem[] {
  return wishlist.items.filter(item => isReservedByUser(item, userId));
}

/**
 * Converteer Product naar WishlistItem
 */
export function productToWishlistItem(product: Product): WishlistItem {
  return {
    ...product,
    isReserved: false,
    reservedBy: null,
    claimedBy: null,
    addedAt: new Date().toISOString(),
  };
}