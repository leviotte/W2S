// src/lib/services/bolService.ts
import { Product } from '@/types/product'; // Gebruik een pad-alias voor schone imports!

const BOL_AUTH_URL = 'https://login.bol.com/token';
const BOL_CATALOG_API_URL = 'https://api.bol.com/marketing/catalog/v1/products/search';
const PARTNER_ID = '1410335'; // Jouw Bol.com partner ID

/**
 * Haalt een Bol.com access token op. Deze kan gecached worden voor betere performance.
 */
async function getBolAccessToken(): Promise<string> {
  // Eenvoudige in-memory cache, maar voor productie is een Redis cache beter.
  // Voor nu is dit voldoende.
  const response = await fetch(BOL_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${process.env.BOL_API_CLIENT_ID}:${process.env.BOL_API_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store', // Tokens wil je niet cachen in de Data Cache van Next.js
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Bol.com Auth Error:', errorBody);
    throw new Error('Could not authenticate with Bol.com');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Haalt producten op van de Bol.com API op basis van zoekparameters.
 */
export async function getBolProducts(
  keyword: string,
  category: string,
  minPrice: string,
  maxPrice: string,
  sortBy: string,
): Promise<Product[]> {
  if (!keyword) return [];

  try {
    const accessToken = await getBolAccessToken();

    const params = new URLSearchParams({
      'search-term': keyword,
      'country-code': 'BE',
      page: '1',
      'page-size': '20', // Beperk tot 20 voor snellere laadtijden
      sort: sortBy,
      'include-offer': 'true',
      'include-rating': 'true',
      'include-image': 'true',
    });

    const priceRange = `&range-refinement=12194:${minPrice || 0}:${maxPrice || 10000}`;

    const response = await fetch(`${BOL_CATALOG_API_URL}?${params.toString()}${priceRange}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      // Gebruik de Next.js fetch cache voor requests! 1 uur caching.
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Bol.com API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map de resultaten naar onze gestandaardiseerde Product interface
    return data.results.map((item: any): Product => {
      const productUrl = item.url;
      const affiliateUrl = `https://partner.bol.com/click/click?p=2&t=url&s=${PARTNER_ID}&f=TXL&url=${encodeURIComponent(productUrl)}&name=${encodeURIComponent(item.title)}`;

      return {
        source: 'Bol.com',
        id: item.bolProductId,
        title: item.title || 'Geen titel',
        url: affiliateUrl,
        imageUrl: item.image?.url || '/placeholder-image.jpg',
        price: item.offer?.price ? parseFloat(item.offer.price) : 0,
        ean: item.ean,
        rating: item.rating?.averageRating,
        reviewCount: item.rating?.totalReviews,
      };
    });
  } catch (error) {
    console.error('Failed to fetch Bol.com products:', error);
    return []; // Geef altijd een lege array terug bij een fout
  }
}