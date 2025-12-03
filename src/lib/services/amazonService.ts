// src/lib/services/amazonService.ts
import { Product } from '@/types/products';
import { AmazonPaApiClient, type SearchItemsRequest } from 'amazon-pa-api5-node-ts';

// Senior Mentor Tip: Zorg dat je path aliases hebt geconfigureerd in je tsconfig.json
// "paths": { "@/*": ["./src/*"] }

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

/**
 * Haalt producten op van de Amazon PA-API, gestandaardiseerd naar onze Product interface.
 */
export async function getAmazonProducts(
  keyword: string,
  category: string,
  minPriceStr: string,
  maxPriceStr: string,
  sortBy: string,
): Promise<Product[]> {
  if (!keyword) return [];

  // Amazon's API vereist prijzen in centen (als integer).
  const minPrice = minPriceStr ? Math.round(parseFloat(minPriceStr) * 100) : undefined;
  const maxPrice = maxPriceStr ? Math.round(parseFloat(maxPriceStr) * 100) : undefined;

  const request: SearchItemsRequest = {
    Keywords: keyword,
    SearchIndex: categoryMapping[category] || 'All',
    Resources: [
      'Images.Primary.Medium',
      'ItemInfo.Title',
      'ItemInfo.ExternalIds',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
      'DetailPageURL',
    ],
    ItemCount: 20,
    PartnerType: 'Associates',
    Condition: 'New',
    MinPrice: minPrice,
    MaxPrice: maxPrice,
    // Vertaal onze generieke sortBy naar de specifieke waarden van Amazon.
    SortBy: sortBy === 'PRICE_ASC' ? 'Price:LowToHigh' : sortBy === 'PRICE_DESC' ? 'Price:HighToLow' : 'Relevance',
  };

  try {
    // Deze library gebruikt zijn eigen fetch-implementatie, dus Next.js caching
    // via het { next: ... } object is hier niet van toepassing. Caching gebeurt in de API route.
    const response = await client.searchItems(request);

    if (!response.SearchResult?.Items) {
      console.warn(`Amazon: Geen resultaten voor '${keyword}'`);
      return [];
    }

    // Map de Amazon response naar onze gestandaardiseerde Product interface.
    return response.SearchResult.Items.map((item): Product => {
      return {
        source: 'Amazon',
        id: item.ASIN!,
        title: item.ItemInfo?.Title?.DisplayValue || 'Geen titel',
        url: item.DetailPageURL!,
        imageUrl: item.Images?.Primary?.Medium?.URL || '/placeholder-image.jpg',
        price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        ean: item.ItemInfo?.ExternalIds?.EANs?.DisplayValues?.[0],
        rating: item.CustomerReviews?.StarRating,
        reviewCount: item.CustomerReviews?.Count,
      };
    });
  } catch (error: any) {
    // De API library geeft gedetailleerde errors, die we hier loggen.
    console.error('Fout bij Amazon PA-API request:', JSON.stringify(error?.data, null, 2));
    return []; // Geef altijd een lege array terug, zodat de hele app niet crasht.
  }
}