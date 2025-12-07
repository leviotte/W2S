// src/types/product.ts
import { z } from 'zod';

// Dit schema definieert de zoek/filter opties. Essentieel voor je API's.
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

// Schema voor wie een item geclaimd heeft op een wenslijst.
export const claimedBySchema = z.object({
  userId: z.string(),
  userName: z.string(),
  quantity: z.number().optional(),
});

// Enum voor de bron van het product.
export const productSourceSchema = z.enum(["Amazon", "Bol.com", "Internal", "dummy"]);

// Schema voor platform-specifieke data, briljant idee!
export const platformSpecificDataSchema = z.object({
  source: productSourceSchema,
  url: z.string().url(),
  price: z.number(),
});

// Het centrale product-schema, gebaseerd op jouw gedetailleerde opzet.
export const productSchema = z.object({
  id: z.union([z.string(), z.number()]), // ID kan ASIN (string) of EAN (nummer) zijn
  source: productSourceSchema,
  title: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url(),
  price: z.number(),
  ean: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Dit is een top-idee om prijsvergelijking mogelijk te maken.
  platforms: z.array(platformSpecificDataSchema).optional(),
  hasMultiplePlatforms: z.boolean().optional(),
});

// Een WishlistItem is een Product, met een extra 'claimedBy' veld. Perfect.
export const wishlistItemSchema = productSchema.extend({
  claimedBy: claimedBySchema.optional().nullable(),
});

// Exporteer de afgeleide TypeScript types voor gebruik in de hele applicatie.
export type ProductQueryOptions = z.infer<typeof productQueryOptionsSchema>;
export type Product = z.infer<typeof productSchema>;
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type ClaimedBy = z.infer<typeof claimedBySchema>;