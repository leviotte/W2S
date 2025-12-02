// app/api/amazon/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import AmazonPaApiClient from "amazon-pa-api5-node-ts";

// Typen voor de Amazon response items
interface AmazonItem {
  asin: string;
  detailPageUrl?: string;
  images?: {
    primary?: {
      small?: { url: string };
      medium?: { url: string };
    };
  };
  itemInfo?: {
    title?: { displayValue: string };
  };
  offers?: {
    listings?: { price?: { displayAmount: string } }[];
  };
}

// Typen voor je frontend-output
interface AmazonProduct {
  id: string;
  title: string;
  image: string;
  price: string;
  url: string;
}

// Singleton client
const client = new AmazonPaApiClient({
  accessKey: process.env.PAAPI_ACCESS_KEY!,
  secretKey: process.env.PAAPI_SECRET_KEY!,
  partnerTag: process.env.PAAPI_PARTNER_TAG!,
  host: "webservices.amazon.com",
  region: "us-east-1",
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const keywords = url.searchParams.get("keywords") || "fitness";

    const response = await client.searchItems({
      Keywords: keywords,
      SearchIndex: "All",
      Resources: [
        "Images.Primary.Small",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "DetailPageURL",
      ],
    });

    const items: AmazonProduct[] =
      (response.items as AmazonItem[] | undefined)?.map((item) => ({
        id: item.asin,
        title: item.itemInfo?.title?.displayValue || "Unnamed Product",
        image: item.images?.primary?.small?.url || "",
        price: item.offers?.listings?.[0]?.price?.displayAmount || "",
        url: item.detailPageUrl || "#",
      })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("❌ Amazon PAAPI Error:", error);
    return NextResponse.json({ error: "PAAPI request failed" }, { status: 500 });
  }
}
