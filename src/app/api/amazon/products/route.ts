// app/api/amazon/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

// DEFINITIEVE FIX: Gebruik de named export nu de omgeving is opgeschoond.
import { AmazonPaApiClient, type SearchItemsRequest } from 'amazon-pa-api5-node-ts';
import config from '@/config/env';

interface AmazonProduct {
  ID: string;
  URL: string;
  Title: string;
  ShortName: string;
  ImageURL: string;
  Ean: string | null;
  Price: number;
  Source: 'AMZ';
}

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
    const keyword = url.searchParams.get('keyword');
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is vereist' }, { status: 400 });
    }

    const request: SearchItemsRequest = {
      Keywords: keyword,
      SearchIndex: 'All',
      Resources: [
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'ItemInfo.ExternalIds',
      ],
      ItemPage: page,
      ItemCount: 10,
    };
    
    console.log(`[Amazon PA-API] Searching for keyword: "${keyword}", page: ${page}`);
    const resp = await client.searchItems(request);

    const items: AmazonProduct[] =
      resp.items?.map((item) => {
        const title = item.itemInfo?.title?.displayValue || 'Unnamed Product';
        const imageUrl = item.images?.primary?.medium?.url || '/assets/placeholder-image.png';
        const itemUrl = item.detailPageUrl || '#';
        const priceStr = item.offers?.listings?.[0]?.price?.displayAmount;
        const ean = item.itemInfo?.externalIds?.ean?.displayValues?.[0] || null;

        return {
          ID: item.asin,
          URL: itemUrl,
          Title: title,
          ShortName: extractShortName(title),
          ImageURL: imageUrl,
          Ean: ean,
          Price: extractPrice(priceStr),
          Source: 'AMZ',
        };
      }) || [];

    return NextResponse.json(items);

  } catch (error: any) {
    console.error("❌ Amazon PA-API Error:", JSON.stringify(error, null, 2));
    const errorMessage = error.message || 'An unknown error occurred during PA-API request.';
    return NextResponse.json({ error: `PAAPI request failed: ${errorMessage}` }, { status: 500 });
  }
}

// --- Helper Functies ---

function extractShortName(name: string): string {
  if (!name) return 'Unnamed Product';
  const words = name.toLowerCase().split(' ');
  const filtered = words.filter(
    (word) =>
      ![
        'gb', '5g', '4g', '256gb', '128gb', '64gb', 'black', 'blue',
        'green', 'series', 'pro', 'watch', 'case', 'cover', 'accessory',
        'phone', 'smartwatch',
      ].includes(word)
  );
  return filtered.slice(0, 3).join(' ') || 'Unnamed Product';
}

function extractPrice(priceString?: string): number {
  if (!priceString) return 0;
  const cleaned = priceString.replace(/[^\d.,]/g, '').replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}