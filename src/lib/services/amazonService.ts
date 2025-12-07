// src/lib/services/amazonService.ts
import 'server-only';
import { DefaultApi, type SearchItemsRequest, type SearchItemsResponse } from 'amazon-pa-api5-node-ts';
import { Product, ProductQueryOptions } from '@/types/product';

type AmazonItem = NonNullable<NonNullable<SearchItemsResponse['SearchResult']>['Items']>[number];

const client = new DefaultApi();

function parseAmazonItem(item: AmazonItem): Product | null {
  const priceAmount = item.Offers?.Listings?.[0]?.Price?.Amount;
  
  if (!item.ASIN || !item.DetailPageURL || priceAmount === undefined) {
    return null;
  }
  
  // *** DE FINALE FIX HIER ***
  // We casten StarRating naar 'any' om de 'DisplayValue' te kunnen lezen,
  // omdat de library-types hier onvolledig lijken. Vervolgens parsen we de string.
  const starRatingString = (item.CustomerReviews?.StarRating as any)?.DisplayValue;
  const ratingValue = starRatingString ? parseFloat(starRatingString) : undefined;

  return {
    id: item.ASIN,
    source: 'Amazon',
    title: item.ItemInfo?.Title?.DisplayValue ?? 'Titel niet beschikbaar',
    url: item.DetailPageURL,
    imageUrl: item.Images?.Primary?.Large?.URL ?? item.Images?.Primary?.Medium?.URL ?? '/default-avatar.png',
    price: priceAmount,
    ean: item.ItemInfo?.ExternalIds?.EANs?.DisplayValues?.[0],
    category: item.ItemInfo?.Classifications?.Binding?.DisplayValue,
    // We gebruiken de correct geparste numerieke waarde.
    rating: ratingValue && !isNaN(ratingValue) ? ratingValue : undefined,
    reviewCount: item.CustomerReviews?.Count,
    description: item.ItemInfo?.Features?.DisplayValues?.join('\n'),
  };
}

export async function getAmazonProducts(options: ProductQueryOptions): Promise<Product[]> {
  const { query, category, minPrice, maxPrice, limit = 10, offset = 0 } = options;
  if (!query) return [];

  const requestParams = {
    PartnerTag: process.env.AMAZON_PARTNER_TAG!,
    PartnerType: 'Associates',
    AccessKey: process.env.AMAZON_ACCESS_KEY!,
    SecretKey: process.env.AMAZON_SECRET_KEY!,
    Host: 'webservices.amazon.nl',
    Region: 'eu-west-1',
    Keywords: query,
    SearchIndex: category ?? 'All',
    ItemCount: limit,
    ItemPage: Math.floor(offset / limit) + 1,
    Condition: 'New' as const,
    Resources: [
      'Images.Primary.Large', 'Images.Primary.Medium', 'ItemInfo.Title', 
      'ItemInfo.Features', 'ItemInfo.Classifications', 'ItemInfo.ExternalIds', 
      'Offers.Listings.Price', 'CustomerReviews.Count', 'CustomerReviews.StarRating',
    ],
    MinPrice: minPrice ? Math.round(minPrice) : undefined,
    MaxPrice: maxPrice ? Math.round(maxPrice) : undefined,
  };
  
  try {
    const response = await client.searchItems(requestParams as unknown as SearchItemsRequest);
    const items = response.SearchResult?.Items;
    if (!items) return [];
    return items.map(parseAmazonItem).filter((p): p is Product => p !== null);
  } catch (error: any) {
    console.error('❌ Amazon PA-API Service Error:', JSON.stringify(error, null, 2));
    return [];
  }
}