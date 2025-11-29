// app/api/amazon/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AmazonPaApiClient, SearchItemsRequest } from "amazon-pa-api5-node-ts";

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

    const request: SearchItemsRequest = {
      Keywords: keywords,
      SearchIndex: "All",
      Resources: [
        "Images.Primary.Small",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "DetailPageURL",
      ],
    };

    const response = await client.searchItems(request);

    const items =
      response.items?.map((item) => ({
        id: item.asin,
        title: item.itemInfo?.title?.displayValue || "Unnamed Product",
        image: item.images?.primary?.small?.url || "",
        price: item.offers?.listings?.[0]?.price?.displayAmount || "",
        url: item.detailPageUrl || "#",
      })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Amazon PAAPI Error:", error);
    return NextResponse.json({ error: "PAAPI request failed" }, { status: 500 });
  }
}
