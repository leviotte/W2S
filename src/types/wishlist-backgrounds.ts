// src/types/wishlist-backgrounds.ts

/** ✅ Single background image voor wishlists */
export interface WishlistBackImage {
  id: string;
  title: string;
  imageLink: string;
  categoryId?: string;
  isLive: boolean;
}

/** ✅ Category voor wishlist-backimages */
export interface WishlistCategory {
  id: string;
  name: string;
}
