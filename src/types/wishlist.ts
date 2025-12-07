// src/types/wishlist.ts
import { z } from 'zod';
import { wishlistItemSchema } from './product';

export const wishlistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  // CORE FIX: Changed `isPublic` to `isPrivate` to match component logic
  isPrivate: z.boolean().default(false), 
  description: z.string().optional(),
  items: z.array(wishlistItemSchema),
  backgroundImage: z.string().optional(),
  owner: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type Wishlist = z.infer<typeof wishlistSchema>;

export const createWishlistSchema = wishlistSchema.pick({
    name: true,
    isPrivate: true, // Also updated here
    description: true,
    items: true,
});

export type CreateWishlistData = z.infer<typeof createWishlistSchema>;