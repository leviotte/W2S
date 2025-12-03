"use server";

import "server-only";
import { cache } from "react";
import { AmazonSearchResultSchema } from "@/types/amazon";
import { parseAmazonItem } from "@/lib/amazon/parse";

const API_HOST = "https://webservices.amazon.com/paapi5/searchitems";
const PARTNER_TAG = process.env.AMAZON_TAG!;
const ACCESS_KEY = process.env.AMAZON_ACCESS!;
const SECRET_KEY = process.env.AMAZON_SECRET!;
const REGION = "eu-west-1";

export const searchAmazon = cache(async function searchAmazon(query: string) {
  try {
    const body = {
      PartnerTag: PARTNER_TAG,
      PartnerType: "Associates",
      Keywords: query,
      SearchIndex: "All",
      Resources: [
        "Images.Primary.Large",
        "Images.Primary.Medium",
        "Images.Primary.Small",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "ItemInfo.ProductInfo",
        "Offers.Listings.Price",
      ],
    };

    const res = await fetch(API_HOST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Amz-Date": new Date().toISOString(),
        "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
        "X-Amz-Access-Key": ACCESS_KEY,
        "X-Amz-Secret-Key": SECRET_KEY,
        "X-Amz-Region": REGION,
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 * 10 }, // 10 min
    });

    const json = await res.json();

    const parsed = AmazonSearchResultSchema.safeParse(json);

    if (!parsed.success) {
      console.error("❌ Amazon API parse error:", parsed.error);
      return [];
    }

    return parsed.data.SearchResult.Items.map((item) =>
      parseAmazonItem(item)
    );
  } catch (err) {
    console.error("❌ Amazon Search failed:", err);
    return []; // SAFE fallback
  }
});
