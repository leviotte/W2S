// src/lib/utils/product-helpers.ts
import type { Product } from '@/types/product';
import type { WishlistItem } from '@/types/wishlist';

/**
 * ✅ SIMPLIFIED: Convert Product to WishlistItem format
 * Deze functie wordt gebruikt in create wishlist page
 */
export function productToWishlistItem(product: Product): WishlistItem {
  return {
    id: product.id,
    source: product.source,
    title: product.title,
    url: product.url,
    imageUrl: product.imageUrl,
    price: product.price,
    ean: product.ean,
    category: product.category,
    description: product.description,
    rating: product.rating,
    reviewCount: product.reviewCount,
    ageGroup: product.ageGroup,
    gender: product.gender,
    tags: product.tags,
    platforms: product.platforms,
    hasMultiplePlatforms: product.hasMultiplePlatforms,
    // Wishlist-specific fields
    quantity: 1,
    isReserved: false,
    reservedBy: null,
    claimedBy: null,
    addedAt: new Date().toISOString(),
  };
}

/**
 * ✅ DETAILED VERSION (alias voor backwards compatibility)
 */
export const productToWishlistItemDetailed = productToWishlistItem;

/**
 * ✅ Format price for display
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