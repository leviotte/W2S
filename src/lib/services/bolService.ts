// src/lib/services/bolService.ts
import 'server-only';
import { Product, ProductQueryOptions } from "@/types/product";

const BOL_AUTH_URL = 'https://login.bol.com/token';
const BOL_API_URL = 'https://api.bol.com/retailer/offers/v1';
const PARTNER_ID = process.env.BOL_PARTNER_ID || '1410335'; 

let tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

interface BolOfferItem {
  ean: string;
  product: {
    title: string;
    gpc: string;
    summary: string;
    media: { type: string; url: string; }[];
  };
  pricing: {
    bundlePrices: {
      unitPrice: string;
    }[];
  };
}

async function getBolAccessToken(): Promise<string> {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  const response = await fetch(BOL_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${process.env.BOL_CLIENT_ID}:${process.env.BOL_CLIENT_SECRET}`)}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!response.ok) {
    const errorBody = await response.json();
    console.error('❌ Bol.com Auth Error:', errorBody);
    throw new Error('Could not authenticate with Bol.com');
  }
  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.accessToken;
}

export async function getBolProducts(options: ProductQueryOptions): Promise<Product[]> {
  const { query, limit = 10, offset = 0 } = options;
  if (!query) return [];

  try {
    const accessToken = await getBolAccessToken();
    const params = new URLSearchParams({
      'search-term': query,
      'country': 'BE',
      'page': (Math.floor(offset / limit) + 1).toString(),
    });
    const response = await fetch(`${BOL_API_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.retailer.v9+json',
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bol.com API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (!data.offers) return [];

    return data.offers.map((item: BolOfferItem): Product | null => {
      if (!item.ean || !item.product || !item.pricing.bundlePrices[0]?.unitPrice) return null;
      const productUrl = `https://www.bol.com/be/nl/p/${item.product.title.replace(/\s/g, '-')}/${item.ean}/`;
      const affiliateUrl = `https://partner.bol.com/click/click?p=2&t=url&s=${PARTNER_ID}&f=TXL&url=${encodeURIComponent(productUrl)}&name=${encodeURIComponent(item.product.title)}`;
      return {
        id: item.ean,
        source: 'Bol.com',
        title: item.product.title,
        url: affiliateUrl,
        imageUrl: item.product.media.find((m) => m.type === 'IMAGE_MAIN')?.url ?? '/default-avatar.png',
        price: parseFloat(item.pricing.bundlePrices[0].unitPrice),
        ean: item.ean,
        category: item.product.gpc,
        rating: undefined,
        reviewCount: undefined,
        description: item.product.summary,
      };
    })
    // *** DE FIX HIER ***
    // We geven de 'p' parameter een expliciet type.
    .filter((p: Product | null): p is Product => p !== null);

  } catch (error) {
    console.error('❌ Failed to fetch Bol.com products:', error);
    return [];
  }
}