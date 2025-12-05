// src/lib/services/bolService.ts

import { Product, ProductQueryOptions } from "@/types/product";

const BOL_AUTH_URL = 'https://login.bol.com/token';
const BOL_CATALOG_API_URL = 'https://api.bol.com/retailer/products'; // Gebruik de retailer API voor meer data
const PARTNER_ID = '1410335'; // Jouw Bol.com partner ID

// Cache de token in het geheugen op server-niveau
let tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

async function getBolAccessToken(): Promise<string> {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const response = await fetch(BOL_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${process.env.BOL_API_CLIENT_ID}:${process.env.BOL_API_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Bol.com Auth Error:', errorBody);
    throw new Error('Could not authenticate with Bol.com');
  }

  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // 60s buffer
  };
  return tokenCache.accessToken;
}

/**
 * Haalt producten op van de Bol.com API met gestandaardiseerde opties.
 */
export async function getBolProducts(options: ProductQueryOptions): Promise<Product[]> {
  const {
    keyword,
    minPrice,
    maxPrice,
    sortBy,
    pageNumber = 1,
  } = options;

  if (!keyword) return [];

  try {
    const accessToken = await getBolAccessToken();

    const params = new URLSearchParams({
      query: keyword,
      country: 'BE',
      page: pageNumber.toString(),
    });

    // De retailer API gebruikt andere parameters, dit is een voorbeeld.
    // Pas dit aan naar de correcte parameters voor de v9 retailer API.

    const response = await fetch(`${BOL_CATALOG_API_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/vnd.retailer.v9+json', // Belangrijk voor Bol.com API versie
      },
      next: { revalidate: 3600 }, // 1 uur caching
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bol.com API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Mapping hangt sterk af van de gebruikte API (catalog vs retailer).
    // Dit is een *voorbeeld* voor de retailer API. Pas aan indien nodig.
    if (!data.products) {
      return [];
    }

    return data.products.map((item: any): Product => {
      const productUrl = `https://www.bol.com/be/nl/p/${item.title.replace(/\s/g, '-')}/${item.offer.id}/`;
      const affiliateUrl = `https://partner.bol.com/click/click?p=2&t=url&s=${PARTNER_ID}&f=TXL&url=${encodeURIComponent(productUrl)}&name=${encodeURIComponent(item.title)}`;
      
      return {
        source: 'Bol.com',
        id: item.offer.id,
        title: item.title,
        url: affiliateUrl,
        imageUrl: item.media.find((m: any) => m.type === 'IMAGE_MAIN')?.url || '/placeholder-image.jpg',
        price: parseFloat(item.offer.pricing.bundlePrices[0].unitPrice),
        ean: item.ean,
        // Rating data is niet altijd beschikbaar in de basis product search
        rating: undefined, 
        reviewCount: undefined,
      };
    });
  } catch (error) {
    console.error('Failed to fetch Bol.com products:', error);
    return [];
  }
}