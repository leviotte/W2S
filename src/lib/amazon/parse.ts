import { AmazonItemRaw, AmazonItemParsed } from "@/src/types/amazon";

export function parseAmazonItem(raw: AmazonItemRaw): {
  raw: AmazonItemRaw;
  parsed: AmazonItemParsed;
} {
  const title =
    raw.ItemInfo?.Title?.DisplayValue?.trim() || null;

  const features =
    raw.ItemInfo?.Features?.DisplayValues ?? [];

  const images = {
    small:
      raw.Images?.Primary?.Small?.URL ??
      raw.Images?.Primary?.Medium?.URL ??
      raw.Images?.Primary?.Large?.URL ??
      null,
    medium:
      raw.Images?.Primary?.Medium?.URL ??
      raw.Images?.Primary?.Large?.URL ??
      raw.Images?.Primary?.Small?.URL ??
      null,
    large:
      raw.Images?.Primary?.Large?.URL ??
      raw.Images?.Primary?.Medium?.URL ??
      raw.Images?.Primary?.Small?.URL ??
      null,
  };

  const priceObj = raw.Offers?.Listings?.[0]?.Price;

  const price = {
    amount: priceObj?.Amount ?? null,
    currency: priceObj?.Currency ?? null,
    display: priceObj?.DisplayAmount ?? null,
  };

  return {
    raw,
    parsed: {
      asin: raw.ASIN,
      title,
      features,
      images,
      url: raw.DetailPageURL ?? null,
      price,
    },
  };
}
