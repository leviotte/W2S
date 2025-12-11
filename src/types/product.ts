// src/types/product.ts
import { z } from 'zod';

/**
 * ✅ SINGLE SOURCE OF TRUTH voor Product
 * Pure product data - ZONDER wishlist-specifieke velden
 */

// Schema voor zoek/filter opties
export const productQueryOptionsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
});

// Enum voor de bron van het product
export const productSourceSchema = z.enum(["Amazon", "Bol.com", "Internal", "dummy"]);

// Schema voor platform-specifieke data (prijsvergelijking)
export const platformSpecificDataSchema = z.object({
  source: productSourceSchema,
  url: z.string().url(),
  price: z.number(),
  imageUrl: z.string().url().optional(),
});

/**
 * Het centrale PURE product schema
 * Bevat GEEN wishlist-specifieke velden (claimedBy, isReserved, etc.)
 */
export const productSchema = z.object({
  id: z.union([z.string(), z.number()]), // ASIN (string) of EAN (number)
  source: productSourceSchema,
  title: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url(),
  price: z.number(),
  
  // Optionele metadata
  ean: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Prijsvergelijking over platforms
  platforms: z.array(platformSpecificDataSchema).optional(),
  hasMultiplePlatforms: z.boolean().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type ProductQueryOptions = z.infer<typeof productQueryOptionsSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductSource = z.infer<typeof productSourceSchema>;
export type PlatformSpecificData = z.infer<typeof platformSpecificDataSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vindt de goedkoopste prijs over alle platforms
 */
export function getCheapestPrice(product: Product): number {
  if (!product.platforms || product.platforms.length === 0) {
    return product.price;
  }
  
  const prices = [product.price, ...product.platforms.map(p => p.price)];
  return Math.min(...prices);
}

/**
 * Vindt het platform met de laagste prijs
 */
export function getCheapestPlatform(product: Product): PlatformSpecificData | null {
  if (!product.platforms || product.platforms.length === 0) {
    return null;
  }
  
  return product.platforms.reduce((cheapest, current) => 
    current.price < cheapest.price ? current : cheapest
  );
}

/**
 * Check of een product op meerdere platforms beschikbaar is
 */
export function hasMultiplePlatforms(product: Product): boolean {
  return !!(product.platforms && product.platforms.length > 0);
}