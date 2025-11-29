// app/services/amazonService.ts
import { AmazonPaApiClient, SearchItemsRequest } from "amazon-pa-api5-node-ts";

export interface AmazonProduct {
  ID: string;
  URL: string;
  Title: string;
  ShortName: string;
  ImageURL: string;
  Ean: string | null;
  Price: number;
  Source: "AMZ";
}

// Age and gender contextual search mapping (in Dutch)
const ageGenderMapping = {
  "under-12": { women: "voor meisjes kinderen", men: "voor jongens kinderen", unisex: "voor kinderen" },
  "12-18": { women: "voor tienermeisjes", men: "voor tienerjongens", unisex: "voor tieners" },
  "18-25": { women: "voor jonge vrouwen", men: "voor jonge mannen", unisex: "voor jongeren" },
  "25-35": { women: "voor vrouwen", men: "voor mannen", unisex: "voor volwassenen" },
  "35-50": { women: "voor vrouwen", men: "voor mannen", unisex: "voor volwassenen" },
  "over-50": { women: "voor oudere vrouwen", men: "voor oudere mannen", unisex: "voor ouderen" },
};

// Popular Dutch search filters for product enhancing
const dutchSearchFilters = [
  "beste kwaliteit", "populair", "aanbevolen", "bestseller",
  "nieuw", "trending", "aanbieding"
];

// Map Amazon categories to valid SearchIndex values
const categoryMapping: Record<string, string> = {
  "Clothing & Jewelry": "Apparel",
  "Food & Drinks": "Grocery",
  "Toys & Games": "Toys",
  "Sports & Outdoors": "SportingGoods",
  "Cell Phones & Accessories": "Electronics",
  "Arts, Crafts & Sewing": "ArtsAndCrafts",
  "All": "All"
};

// Singleton PAAPI client
const client = new AmazonPaApiClient({
  accessKey: process.env.PAAPI_ACCESS_KEY!,
  secretKey: process.env.PAAPI_SECRET_KEY!,
  partnerTag: process.env.PAAPI_PARTNER_TAG!,
  host: "webservices.amazon.com",
  region: "us-east-1",
});

/**
 * Fetch Amazon products with optional filters
 */
export const getAmazonProducts = async (
  keyword: string,
  category: string = "All",
  minPrice?: number,
  maxPrice?: number,
  page: number = 1,
  pageSize: number = 10,
  age?: keyof typeof ageGenderMapping,
  gender?: "women" | "men" | "unisex"
): Promise<AmazonProduct[]> => {
  if (!keyword) return [];

  // Enhance search keyword with filters
  let searchKeyword = keyword;
  if (age && gender) searchKeyword += ` ${ageGenderMapping[age][gender]}`;
  searchKeyword += " " + dutchSearchFilters.join(" ");

  const request: SearchItemsRequest = {
    Keywords: searchKeyword,
    SearchIndex: categoryMapping[category] || "All",
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "Offers.Listings.Price",
      "ItemInfo.ExternalIds",
      "DetailPageURL",
    ],
    ItemPage: page,
  };

  try {
    const response = await client.searchItems(request);

    const items: AmazonProduct[] =
      response.items?.map((item) => {
        const title = item.itemInfo?.title?.displayValue || "Unnamed Product";
        const imageUrl = item.images?.primary?.medium?.url || "No Image";
        const url = item.detailPageUrl || "#";
        const priceStr = item.offers?.listings?.[0]?.price?.displayAmount;
        const ean = item.itemInfo?.externalIds?.eans?.[0] || null;

        return {
          ID: item.asin,
          URL: url,
          Title: title,
          ShortName: extractShortName(title),
          ImageURL: imageUrl,
          Ean: ean,
          Price: extractPrice(priceStr),
          Source: "AMZ",
        };
      }) || [];

    return items;
  } catch (error) {
    console.error("❌ PAAPI request failed:", error);
    return [];
  }
};

// -------------------- Helpers --------------------

function extractShortName(name: string): string {
  if (!name) return "Unnamed Product";
  const words = name.toLowerCase().split(" ");
  const filtered = words.filter(
    (word) =>
      ![
        "gb", "5g", "4g", "256gb", "128gb", "64gb",
        "black", "blue", "green", "series", "pro",
        "watch", "case", "cover", "accessory",
        "phone", "smartwatch",
      ].includes(word)
  );
  return filtered.slice(0, 3).join(" ") || "Unnamed Product";
}

function extractPrice(priceString?: string): number {
  if (!priceString) return 0;
  let cleaned = priceString.replace(/[^\d.,]/g, "").replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
