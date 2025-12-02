// app/api/amazon/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AmazonPaApiClient, SearchItemsRequest } from "amazon-pa-api5-node-ts";
import config from "@/config/env";

interface AmazonProduct {
  ID: string;
  URL: string;
  Title: string;
  ShortName: string;
  ImageURL: string;
  Ean: string | null;
  Price: number;
  Source: "AMZ";
}

// Singleton client
const client = new AmazonPaApiClient({
  accessKey: config.aws.accessKey,
  secretKey: config.aws.secretKey,
  partnerTag: config.aws.partnerTag,
  host: config.aws.host,
  region: config.aws.region,
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get("keyword") || "";
    const page = parseInt(url.searchParams.get("page") || "1");

    if (!keyword) return NextResponse.json([], { status: 200 });

    const request: SearchItemsRequest = {
      Keywords: keyword,
      SearchIndex: "All",
      Resources: [
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "ItemInfo.ExternalIds",
      ],
      ItemPage: page,
    };

    const response = await client.searchItems(request);

    const items: AmazonProduct[] =
      response.items?.map((item) => {
        const title = item.itemInfo?.title?.displayValue || "Unnamed Product";
        const imageUrl = item.images?.primary?.medium?.url || "No Image";
        const url = item.detailPageUrl || "#";
        const priceStr = item.offers?.listings?.[0]?.price?.displayAmount;
        const ean = item.itemInfo?.externalIds?.ean?.displayValues?.[0] || null;

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

    return NextResponse.json(items);
  } catch (error) {
    console.error("❌ Amazon PAAPI Error:", error);
    return NextResponse.json({ error: "PAAPI request failed" }, { status: 500 });
  }
}

// Helpers
function extractShortName(name: string) {
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
