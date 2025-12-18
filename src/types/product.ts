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
  URL: z.string().url(),
  Price: z.number(),
  Source: z.string(),
});

/**
 * Het centrale PURE product schema
 * Bevat GEEN wishlist-specifieke velden (claimedBy, isReserved, etc.)
 */
export const productSchema = z.object({
  id: z.union([z.string(), z.number()]), // ✅ VERPLICHT - ASIN (string) of EAN (number)
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
  platforms: z.record(z.string(), platformSpecificDataSchema).optional(), // ✅ FIXED: 2 argumenten
  hasMultiplePlatforms: z.boolean().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type ProductQueryOptions = z.infer<typeof productQueryOptionsSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductSource = z.infer<typeof productSourceSchema>;
export type PlatformSpecificData = z.infer<typeof platformSpecificDataSchema>;

// ✅ Extended type voor UI state (met isIncluded flag)
export type ProductWithInclusion = Product & { isIncluded?: boolean };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vindt de goedkoopste prijs over alle platforms
 */
export function getCheapestPrice(product: Product): number {
  if (!product.platforms || Object.keys(product.platforms).length === 0) {
    return product.price;
  }
  
  const prices = [product.price, ...Object.values(product.platforms).map(p => p.Price)];
  return Math.min(...prices);
}

/**
 * Vindt het platform met de laagste prijs
 */
export function getCheapestPlatform(product: Product): { name: string; data: PlatformSpecificData } | null {
  if (!product.platforms || Object.keys(product.platforms).length === 0) {
    return null;
  }
  
  let cheapest = { 
    name: Object.keys(product.platforms)[0], 
    data: Object.values(product.platforms)[0] 
  };
  
  Object.entries(product.platforms).forEach(([name, data]) => {
    if (data.Price < cheapest.data.Price) {
      cheapest = { name, data };
    }
  });
  
  return cheapest;
}

/**
 * Check of een product op meerdere platforms beschikbaar is
 */
export function hasMultiplePlatforms(product: Product): boolean {
  return !!(product.platforms && Object.keys(product.platforms).length > 1);
}