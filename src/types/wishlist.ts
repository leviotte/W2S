// src/types/wishlist.ts
import { z } from 'zod';
// We gaan ervan uit dat je een 'product.ts' hebt die een ProductSchema exporteert.
// Als dat niet zo is, kunnen we dit later aanpassen.
import { productSchema } from './product';

// Een item binnen een wishlist. Dit breidt ons basis ProductSchema uit.
export const WishlistItemSchema = productSchema.extend({
  isReserved: z.boolean().default(false),
  reservedBy: z.string().optional().nullable(),
  // Je kan hier later nog zaken als 'aantal' of 'prioriteit' toevoegen.
});

// Het hoofdschema voor een Wishlist.
export const WishlistSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "De naam van de wishlist moet minstens 3 tekens lang zijn."),
  ownerId: z.string(), // Essentieel: de ID van de UserProfile die de eigenaar is.
  isPublic: z.boolean().default(true), // Standaard publiek, kan aangepast worden.
  description: z.string().optional().nullable(),
  slug: z.string().optional().nullable(), // Perfect voor SEO-vriendelijke URLs.
  eventDate: z.string().optional().nullable(),
  backgroundImage: z.string().url().optional().nullable(),
  items: z.array(WishlistItemSchema).default([]),
});

// Exporteer de afgeleide TypeScript types voor gebruik in onze code.
export type Wishlist = z.infer<typeof WishlistSchema>;
export type WishlistItem = z.infer<typeof WishlistItemSchema>;