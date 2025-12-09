// src/types/wishlist.ts
import { z } from 'zod';
import { wishlistItemSchema } from './product';
// FIX: Het pad naar ons nieuwe, gecentraliseerde timestamp-schema is nu correct.
import { timestampSchema } from './firebase';

export const wishlistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  isPrivate: z.boolean().default(false),
  description: z.string().optional(),
  items: z.array(wishlistItemSchema).default([]),
  backgroundImage: z.string().optional(),
  owner: z.string().optional(),
  // Gebruikt nu ons "gold standard" schema
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Wishlist = z.infer<typeof wishlistSchema>;

export const createWishlistSchema = wishlistSchema.pick({
    name: true,
    isPrivate: true,
    description: true,
    items: true,
});

export type CreateWishlistData = z.infer<typeof createWishlistSchema>;