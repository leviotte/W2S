// app/api/amazon/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DefaultApi } from "amazon-pa-api5-node-ts";

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

// Typen voor frontend output
interface AmazonProduct {
  id: string;
  title: string;
  image: string;
  price: string;
  url: string;
}

const client = new DefaultApi(); // Constructor vereist geen arguments

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const keywords = url.searchParams.get("keywords") || "fitness";

    // Credentials + request parameters worden hier meegegeven
    const response = await client.searchItems({
      AccessKey: process.env.PAAPI_ACCESS_KEY!,
      SecretKey: process.env.PAAPI_SECRET_KEY!,
      PartnerTag: process.env.PAAPI_PARTNER_TAG!,
      Host: "webservices.amazon.com",
      Region: "us-east-1",
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
    return NextResponse.json(
      { error: "PAAPI request failed" },
      { status: 500 }
    );
  }
}
