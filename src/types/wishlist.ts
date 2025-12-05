import { z } from 'zod';

// ============================================================================
// WishlistItem Schema & Type
// De kleinste eenheid: één item op een wishlist.
// ============================================================================
export const wishlistItemSchema = z.object({
  id: z.string().uuid(), // We standaardiseren op een UUID voor elk nieuw item
  title: z.string().min(1, 'De titel van het item mag niet leeg zijn.'),
  description: z.string().optional(),
  url: z.string().url('Geef een geldige link op.').optional().or(z.literal('')),
  image: z.string().url('Geef een geldige afbeelding-link op.').nullable().optional(),
  
  // 'coerce' converteert een string automatisch naar een nummer. Perfect voor prijzen!
  price: z.coerce.number().positive('De prijs moet een positief getal zijn.').optional(),
  
  source: z.string().optional(), // Bv. 'bol.com', 'amazon.nl'
  platforms: z.record(z.string(), z.any()).optional(), // Voor prijsvergelijkingsdata

  isClaimed: z.boolean().default(false),
  claimedBy: z.object({
    userId: z.string(),
    userName: z.string(),
  }).nullable().optional(),
});

export type WishlistItem = z.infer<typeof wishlistItemSchema>;

// ============================================================================
// Wishlist Schema & Type
// Het hoofddocument dat een collectie van WishlistItems bevat.
// ============================================================================
export const wishlistSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(), // De UID van de eigenaar van het account
  profileId: z.string().nullable(), // De ID van het subprofiel (of null voor hoofdaccount)
  name: z.string().min(1, 'De naam van de wishlist is verplicht.'),
  slug: z.string().min(1, 'De slug is verplicht.'),
  description: z.string().optional(),
  items: z.array(wishlistItemSchema).default([]),
  isPrivate: z.boolean().default(false),
  backgroundImage: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Wishlist = z.infer<typeof wishlistSchema>;