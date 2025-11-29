import { z } from "zod";

export const AmazonImageSchema = z.object({
  URL: z.string().url().optional(),
  Height: z.number().optional(),
  Width: z.number().optional(),
});

export const AmazonItemSchema = z.object({
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
      Title: z
        .object({
          DisplayValue: z.string().optional(),
        })
        .optional(),

      Features: z
        .object({
          DisplayValues: z.array(z.string()).optional(),
        })
        .optional(),

      ProductInfo: z
        .object({
          Color: z.object({ DisplayValue: z.string().optional() }).optional(),
          Size: z.object({ DisplayValue: z.string().optional() }).optional(),
          ReleaseDate: z
            .object({ DisplayValue: z.string().optional() })
            .optional(),
        })
        .optional(),
    })
    .optional(),

  Offers: z
    .object({
      Listings: z
        .array(
          z.object({
            Price: z
              .object({
                Amount: z.number().optional(),
                Currency: z.string().optional(),
                DisplayAmount: z.string().optional(),
              })
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const AmazonSearchResultSchema = z.object({
  SearchResult: z.object({
    Items: z.array(AmazonItemSchema),
  }),
});

// RAW type
export type AmazonItemRaw = z.infer<typeof AmazonItemSchema>;

// CLEANED type
export interface AmazonItemParsed {
  asin: string;
  title: string | null;
  features: string[];
  images: {
    small: string | null;
    medium: string | null;
    large: string | null;
  };
  url: string | null;
  price: {
    amount: number | null;
    currency: string | null;
    display: string | null;
  };
}
