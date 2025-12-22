// lib/utils/serializers.ts

import type { WishlistItem, Wishlist } from '@/types/wishlist';
import type { UserProfile } from '@/types/user';

// Helper die altijd ALLE optionele velden garandeert voor TypeScript strict
export function serializeWishlistItem(item: any): WishlistItem {
  return {
    ...item,
    addedAt: item.addedAt?.toDate?.()
      ? item.addedAt.toDate().toISOString()
      : typeof item.addedAt === 'string' ? item.addedAt : undefined,
    updatedAt: item.updatedAt?.toDate?.()
      ? item.updatedAt.toDate().toISOString()
      : typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    // eventueel andere, zoals reservedAt, claimedAt, etc. op dezelfde manier:
    reservedAt: item.reservedAt?.toDate?.()
      ? item.reservedAt.toDate().toISOString()
      : typeof item.reservedAt === 'string' ? item.reservedAt : undefined,
    claimedAt: item.claimedAt?.toDate?.()
      ? item.claimedAt.toDate().toISOString()
      : typeof item.claimedAt === 'string' ? item.claimedAt : undefined,
  };
}

export function serializeWishlist(data: any, idOverride?: string): Wishlist {
  return {
    ...(idOverride ? { id: idOverride } : {}),
    ...data,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : typeof data.createdAt === 'string' ? data.createdAt : null,
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : typeof data.updatedAt === 'string' ? data.updatedAt : null,
    items: Array.isArray(data.items)
      ? (data.items as any[]).map(serializeWishlistItem)
      : [],
  };
}
export function serializeUserProfile(data: any, idOverride?: string): UserProfile {
  return {
    ...(idOverride ? { id: idOverride } : {}),
    ...data,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : typeof data.createdAt === 'string'
      ? data.createdAt
      : undefined,
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : typeof data.updatedAt === 'string'
      ? data.updatedAt
      : undefined,
    birthdate: data.birthdate?.toDate?.()
      ? data.birthdate.toDate().toISOString()
      : (typeof data.birthdate === 'string' ? data.birthdate : null),
  };
}