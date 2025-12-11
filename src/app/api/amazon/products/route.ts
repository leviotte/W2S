import { NextRequest, NextResponse } from 'next/server';
import { ProductSearchParams, AmazonProduct } from '@/types/affiliate';

// Rate limiting zou hier kunnen komen (Vercel KV)
// import { kv } from '@vercel/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Mock data voor development/fallback
 * In productie zou dit vervangen worden door echte Amazon PA API calls
 */
function getMockProducts(params: ProductSearchParams): AmazonProduct[] {
  // Sample data - in productie zou dit uit je backend komen
  const mockProducts: AmazonProduct[] = [
    {
      ASIN: 'B08N5WRWNW',
      Title: 'PlayStation 5 Console',
      ImageURL: 'https://m.media-amazon.com/images/I/51wfKE2fMOL._AC_SL1500_.jpg',
      Price: '€499.99',
      PriceWithoutSaving: '€549.99',
      Saving: '€50.00',
      Features: ['Ultra HD Blu-ray', '825GB SSD', '4K Gaming'],
      URL: 'https://www.amazon.nl/dp/B08N5WRWNW',
    },
    {
      ASIN: 'B0BSHF7WHW',
      Title: 'Apple AirPods Pro (2nd Generation)',
      ImageURL: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
      Price: '€249.00',
      PriceWithoutSaving: '€299.00',
      Saving: '€50.00',
      Features: ['Active Noise Cancellation', 'Wireless Charging', 'Spatial Audio'],
      URL: 'https://www.amazon.nl/dp/B0BSHF7WHW',
    },
    // Voeg meer sample producten toe...
  ];

  // Filtering
  let filtered = mockProducts;

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter((p) =>
      p.Title.toLowerCase().includes(keyword) ||
      p.Features.some((f) => f.toLowerCase().includes(keyword))
    );
  }

  if (params.category && params.category !== 'All') {
    // In productie zou dit echte category filtering doen
    // filtered = filtered.filter(p => p.category === params.category);
  }

  if (params.minPrice !== undefined) {
    filtered = filtered.filter((p) => {
      const price = parseFloat(p.Price?.replace(/[^0-9.]/g, '') || '0');
      return price >= params.minPrice!;
    });
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((p) => {
      const price = parseFloat(p.Price?.replace(/[^0-9.]/g, '') || '0');
      return price <= params.maxPrice!;
    });
  }

  // Sorting
  if (params.sortBy) {
    switch (params.sortBy) {
      case 'Price:LowToHigh':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.Price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.Price?.replace(/[^0-9.]/g, '') || '0');
          return priceA - priceB;
        });
        break;
      case 'Price:HighToLow':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.Price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.Price?.replace(/[^0-9.]/g, '') || '0');
          return priceB - priceA;
        });
        break;
    }
  }

  return filtered;
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: ProductSearchParams = {
      keyword: searchParams.get('keyword') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') 
        ? parseFloat(searchParams.get('minPrice')!) 
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? parseFloat(searchParams.get('maxPrice')!)
        : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
    };

    // TODO: In productie, implementeer echte Amazon PA API call
    // const products = await fetchAmazonProducts(params);
    
    // Voor nu: mock data
    const products = getMockProducts(params);

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching Amazon products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// ============================================================================
// TODO: ECHTE AMAZON PA API INTEGRATIE
// ============================================================================

/*
import { amazonPaApi } from '@/lib/services/amazon-pa-api';

async function fetchAmazonProducts(params: ProductSearchParams) {
  const searchRequest = {
    Keywords: params.keyword,
    SearchIndex: params.category === 'All' ? undefined : params.category,
    MinPrice: params.minPrice,
    MaxPrice: params.maxPrice,
    SortBy: params.sortBy,
  };

  const response = await amazonPaApi.searchItems(searchRequest);
  return response.SearchResult.Items.map(item => ({
    ASIN: item.ASIN,
    Title: item.ItemInfo.Title.DisplayValue,
    ImageURL: item.Images.Primary.Large.URL,
    Price: item.Offers.Listings[0].Price.DisplayAmount,
    URL: item.DetailPageURL,
    Features: item.ItemInfo.Features?.DisplayValues || [],
    // etc...
  }));
}
*/