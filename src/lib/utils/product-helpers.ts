// src/lib/utils/product-helpers.ts

import type { Product } from '@/types/product';
import type { WishlistItem } from '@/types/wishlist';

/**
 * ✅ Convert Product naar WishlistItem met correcte field-mapping + images array support
 * - Houdt EAN/ASIN als ID (voor deduplication)
 * - images-array wordt gegarandeerd meegenomen, met fallback naar imageUrl
 *
 * BELANGRIJK: Gebruik GEEN crypto.randomUUID() hier!
 * De action layer (addWishlistItemAction) handled duplicate detection.
 */
export function productToWishlistItem(product: Product): WishlistItem {
  return {
    // Neem alle Product props over (let op: images/imageUrl kunnen elders overschreven worden, vandaar expliciet hieronder!) 
    ...product,

    id: product.id,              // EAN/ASIN of unieke ID
    productId: product.id,       // Backwards compatible

    // Carrousel fix: images altijd als array aanwezig
    images:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product.imageUrl
          ? [product.imageUrl]
          : [],

    // Zorg dat imageUrl altijd de hoofdafbeelding blijft (optioneel: neem eerste uit images)
    imageUrl: product.imageUrl ?? (Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : undefined),

    quantity: 1,
    isReserved: false,
    reservedBy: null,
    claimedBy: null,
    purchasedBy: null,
    addedAt: new Date().toISOString(),
  };
}

/**
 * ✅ BACKWARDS COMPAT alias
 */
export const productToWishlistItemDetailed = productToWishlistItem;

/**
 * ✅ Format price for display (NL/EURO)
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) return '€0.00';

  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(numPrice);
}

/**
 * ✅ Get cheapest price across platforms
 */
export function getCheapestPrice(product: Product): number {
  if (!product.platforms || Object.keys(product.platforms).length === 0) {
    return product.price;
  }

  const allPrices = [product.price, ...Object.values(product.platforms).map((p) => p.Price)];
  return Math.min(...allPrices);
}

/**
 * ✅ Check if product has multiple platforms
 */
export function hasMultipleSources(product: Product): boolean {
  return !!product.platforms && Object.keys(product.platforms).length > 0;
}

/**
 * ✅ Get price savings if multiple platforms
 */
export function getPriceSavings(product: Product): number | null {
  if (!hasMultipleSources(product)) return null;

  const cheapest = getCheapestPrice(product);
  const highest = Math.max(
    product.price,
    ...(Object.values(product.platforms || {}).map((p) => p.Price))
  );

  return highest - cheapest;
}

/**
 * ✅ Get best platform (cheapest price)
 */
export function getBestPlatform(product: Product) {
  if (!product.platforms || Object.keys(product.platforms).length === 0) {
    return {
      source: product.source,
      url: product.url,
      price: product.price,
    };
  }

  const allOptions = [
    { source: product.source, url: product.url, price: product.price },
    ...Object.entries(product.platforms).map(([name, p]) => ({
      source: name,
      url: p.URL,
      price: p.Price,
    })),
  ];

  return allOptions.reduce((best, current) =>
    current.price < best.price ? current : best
  );
}