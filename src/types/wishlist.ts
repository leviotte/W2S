import { z } from 'zod';
import { productSchema } from './product';

export const WishlistItemSchema = productSchema.extend({
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
});

export const WishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "De naam van de wishlist moet minstens 3 tekens lang zijn."),
  ownerId: z.string(),
  isPublic: z.boolean().default(false), // Aangepast naar false voor privacy by default
  description: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  backgroundImage: z.string().url().optional().nullable(),
  items: z.array(WishlistItemSchema).default([]),
  createdAt: z.string().optional(), // Goede praktijk om toe te voegen
  updatedAt: z.string().optional(), // Goede praktijk om toe te voegen
});

export type Wishlist = z.infer<typeof WishlistSchema>;
export type WishlistItem = z.infer<typeof WishlistItemSchema>;