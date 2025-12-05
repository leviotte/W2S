// src/lib/services/amazonService.ts

import { Product, ProductQueryOptions } from '@/types/product';
// Deze import is nu correct dankzij onze tsconfig aanpassing
import AmazonPaApiClient, { type SearchItemsRequest, type Item } from 'amazon-pa-api5-node-ts';

// Singleton PAAPI client. Herbruikt de connectie voor optimale prestaties.
const client = new AmazonPaApiClient({
  accessKey: process.env.AWS_ACCESS_KEY_WISH!,
  secretKey: process.env.AWS_SECRET_KEY_WISH!,
  partnerTag: process.env.AWS_PARTNER_TAG!,
  host: process.env.AWS_HOST || 'webservices.amazon.com.be',
  region: process.env.AWS_REGION || 'eu-west-1',
});

const categoryMapping: Record<string, string> = {
  'Kleding & Sieraden': 'Apparel',
  'Eten & Drinken': 'Grocery',
  'Speelgoed & Spellen': 'Toys',
  'Sport & Outdoor': 'SportingGoods',
  'Telefoons & Accessoires': 'Electronics',
  'Knutselen & Naaien': 'ArtsAndCrafts',
  'All': 'All',
};

export const ageGenderMapping: Record<string, { browseNodeId?: string; gender?: 'Women' | 'Men' }> = {
    'baby': { browseNodeId: '16435130031' },
    'kind': { browseNodeId: '16435135031'},
    'vrouw': { gender: 'Women', browseNodeId: '16435098031' },
    'man': { gender: 'Men', browseNodeId: '16435097031' },
};

/**
 * Haalt producten op van de Amazon PA-API met gestandaardiseerde opties.
 */
export async function getAmazonProducts(options: ProductQueryOptions): Promise<Product[]> {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    sortBy = 'Relevance',
    pageNumber = 1,
    pageSize = 20,
    age,
    gender,
  } = options;

  if (!keyword) return [];

  const request: SearchItemsRequest = {
    Keywords: keyword,
    SearchIndex: category ? categoryMapping[category] || 'All' : 'All',
    Resources: [
      'Images.Primary.Medium',
      'ItemInfo.Title',
      'ItemInfo.ExternalIds',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
      'DetailPageURL',
    ],
    ItemCount: Math.min(pageSize, 10),
    ItemPage: pageNumber,
    PartnerType: 'Associates',
    Condition: 'New',
    MinPrice: minPrice ? Math.round(minPrice * 100) : undefined,
    MaxPrice: maxPrice ? Math.round(maxPrice * 100) : undefined,
    SortBy: sortBy === 'PRICE_ASC' ? 'Price:LowToHigh' : sortBy === 'PRICE_DESC' ? 'Price:HighToLow' : 'Relevance',
  };

  const ageGenderKey = age || gender;
  if (ageGenderKey && ageGenderMapping[ageGenderKey]?.browseNodeId) {
    request.BrowseNodeId = ageGenderMapping[ageGenderKey].browseNodeId;
  }

  try {
    const response = await client.searchItems(request);

    if (!response.SearchResult?.Items) {
      console.warn(`Amazon: Geen resultaten voor '${keyword}' met de gegeven filters.`);
      return [];
    }

    return response.SearchResult.Items.map((item: Item): Product => ({
      source: 'Amazon',
      id: item.ASIN!,
      title: item.ItemInfo?.Title?.DisplayValue || 'Geen titel',
      url: item.DetailPageURL!,
      imageUrl: item.Images?.Primary?.Medium?.URL || '/default-product-image.png',
      price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
      ean: item.ItemInfo?.ExternalIds?.EANs?.DisplayValues?.[0],
      // MENTOR-FIX: Haal de numerieke waarde uit het StarRating object.
      // Het 'Rating' object bevat een 'Value' property met het getal.
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
    }));
  } catch (error: any) {
    console.error('Fout bij Amazon PA-API request:', JSON.stringify(error?.data, null, 2));
    return []; 
  }
}