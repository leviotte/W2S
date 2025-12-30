// src/lib/utils/product-helpers.ts
import type { Product } from '@/types/product';
import type { WishlistItem } from '@/types/wishlist';

/**
 * ✅ Converteer Product naar WishlistItem, volledig type-safe
 * - Vult alle verplichte velden in
 * - Fallbacks voor optionele velden
 * - images-array wordt gegarandeerd meegenomen
 */
export function productToWishlistItem(product: Product): WishlistItem {
  const now = new Date().toISOString();

  return {
    // basis product props
    ...product,

    // verplichte WishlistItem velden
    id: product.id,
    productId: product.id,
    title: product.title ?? '',
    description: product.description ?? null,
    url: product.url ?? '',
    imageUrl:
      product.imageUrl ??
      (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ''),
    images:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product.imageUrl
        ? [product.imageUrl]
        : [],
    price: product.price ?? 0,
    quantity: 1,
    isReserved: false,
    reservedBy: null,
    reservedByName: null,
    claimedBy: null,
    addedAt: now,
    updatedAt: now,
    priority: undefined,
    notes: undefined,
    isPurchased: false,
    purchasedBy: null,
    purchasedAt: null,
    multiPurchasedBy: undefined,
    platforms: product.platforms ?? undefined,
    category: product.category ?? undefined,
    tags: product.tags ?? undefined,
    ageGroup: product.ageGroup ?? undefined,
    gender: product.gender ?? undefined,
  };
}

/**
 * ✅ Backwards-compat alias
 */
export const productToWishlistItemDetailed = productToWishlistItem;
