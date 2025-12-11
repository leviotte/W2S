// src/types/amazon.ts
import { z } from "zod";

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

const AmazonImageSchema = z.object({
  URL: z.string().url().optional(),
  Height: z.number().optional(),
  Width: z.number().optional(),
});

// ============================================================================
// RAW AMAZON API RESPONSE SCHEMA
// ============================================================================

const AmazonRawItemSchema = z.object({
  ASIN: z.string(),
  DetailPageURL: z.string().optional(),
  Images: z
    .object({
      Primary: z.object({
        Large: AmazonImageSchema.optional(),
        Medium: AmazonImageSchema.optional(),
        Small: AmazonImageSchema.optional(),
      }).optional(),
    })
    .optional(),
  ItemInfo: z
    .object({
      Title: z.object({
        DisplayValue: z.string().optional(),
      }).optional(),
      Features: z.object({
        DisplayValues: z.array(z.string()).optional(),
      }).optional(),
    })
    .optional(),
  Offers: z
    .object({
      Listings: z.array(
        z.object({
          Price: z.object({
            Amount: z.number().optional(),
            Currency: z.string().optional(),
            DisplayAmount: z.string().optional(),
          }).optional(),
        })
      ).optional(),
    })
    .optional(),
});

// ============================================================================
// SEARCH RESULT SCHEMA
// ============================================================================

export const AmazonSearchResultSchema = z.object({
  SearchResult: z.object({
    Items: z.array(AmazonRawItemSchema),
    TotalResultCount: z.number().optional(),
  }),
});

// ============================================================================
// PARSED/CLEAN PRODUCT SCHEMA
// ============================================================================

export const AmazonParsedItemSchema = z.object({
  asin: z.string(),
  title: z.string().nullable(),
  features: z.array(z.string()),
  images: z.object({
    small: z.string().url().nullable(),
    medium: z.string().url().nullable(),
    large: z.string().url().nullable(),
  }),
  url: z.string().url().nullable(),
  price: z.object({
    amount: z.number().nullable(),
    currency: z.string().nullable(),
    display: z.string().nullable(),
  }),
});

// ============================================================================
// TRANSFORMATION SCHEMA (RAW -> CLEAN)
// ============================================================================

export const AmazonTransformedItemSchema = AmazonRawItemSchema.transform((rawItem) => {
  const priceListing = rawItem.Offers?.Listings?.[0]?.Price;

  return {
    asin: rawItem.ASIN,
    title: rawItem.ItemInfo?.Title?.DisplayValue ?? null,
    features: rawItem.ItemInfo?.Features?.DisplayValues ?? [],
    images: {
      small: rawItem.Images?.Primary?.Small?.URL ?? null,
      medium: rawItem.Images?.Primary?.Medium?.URL ?? null,
      large: rawItem.Images?.Primary?.Large?.URL ?? null,
    },
    url: rawItem.DetailPageURL ?? null,
    price: {
      amount: priceListing?.Amount ?? null,
      currency: priceListing?.Currency ?? null,
      display: priceListing?.DisplayAmount ?? null,
    },
  };
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type AmazonItemRaw = z.infer<typeof AmazonRawItemSchema>;
export type AmazonItemParsed = z.infer<typeof AmazonParsedItemSchema>;
export type AmazonSearchResult = z.infer<typeof AmazonSearchResultSchema>;