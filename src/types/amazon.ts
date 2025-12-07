// src/types/amazon.ts
import { z } from "zod";

// Schema voor een individuele afbeelding
const AmazonImageSchema = z.object({
  URL: z.string().url().optional(),
  Height: z.number().optional(),
  Width: z.number().optional(),
});

// Het diep geneste schema dat de RUWE API-response van Amazon modelleert
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

// Het schema voor de volledige API Search response
export const AmazonApiResponseSchema = z.object({
  SearchResult: z.object({
    Items: z.array(AmazonRawItemSchema),
    TotalResultCount: z.number().optional(),
  }),
});


// --- DE GOLD STANDARD: Transformatie van RUW naar SCHOON ---

// 1. Definieer het schema voor onze IDEALE, schone product structuur
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

// 2. Creëer een transformerend schema dat RUW omzet naar SCHOON
export const AmazonTransformerSchema = AmazonRawItemSchema.transform((rawItem) => {
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


// 3. Exporteer de afgeleide TypeScript types
export type AmazonRawItem = z.infer<typeof AmazonRawItemSchema>;
export type AmazonParsedItem = z.infer<typeof AmazonParsedItemSchema>;