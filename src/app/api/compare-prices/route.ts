import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { getAmazonProducts } from '@/lib/services/amazonService';
import { getBolProducts } from '@/lib/services/bolService';
import { Product } from '@/types/product';
// import { compareTwoStrings } from 'string-similarity';

const searchSchema = z.object({
  keyword: z.string().min(2, 'Keyword moet minstens 2 karakters lang zijn.'),
  category: z.string().optional().default('All'),
  minPrice: z.string().optional().default('0'),
  maxPrice: z.string().optional().default('10000'),
  sortBy: z.enum(['RELEVANCE', 'PRICE_ASC', 'PRICE_DESC']).optional().default('RELEVANCE'),
});

const redis = Redis.fromEnv();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validation = searchSchema.safeParse(Object.fromEntries(searchParams));

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { keyword, category, minPrice, maxPrice, sortBy } = validation.data;
  const cacheKey = `compare:v4:${keyword}:${category}:${minPrice}:${maxPrice}:${sortBy}`;

  try {
    const cachedData = await redis.get<object>(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] voor key: ${cacheKey}`);
      return NextResponse.json(cachedData);
    }
    console.log(`[CACHE MISS] voor key: ${cacheKey}`);

    const [amazonResult, bolResult] = await Promise.allSettled([
      getAmazonProducts(keyword, category, minPrice, maxPrice, sortBy),
      getBolProducts(keyword, category, minPrice, maxPrice, sortBy),
    ]);

    const allProducts: Product[] = [];
    if (amazonResult.status === 'fulfilled') allProducts.push(...amazonResult.value);
    if (bolResult.status === 'fulfilled') allProducts.push(...bolResult.value);

    const productGroups = new Map<string, Product[]>();
    const matchedProducts = new Set<Product>();

    allProducts.forEach(p => {
      if (p.ean) {
        if (!productGroups.has(p.ean)) productGroups.set(p.ean, []);
        productGroups.get(p.ean)!.push(p);
        matchedProducts.add(p);
      }
    });

    const remainingProducts = allProducts.filter(p => !matchedProducts.has(p));
    remainingProducts.forEach(p => productGroups.set(p.id, [p]));

    // --- RESULTAAT FORMATTERING & SORTERING ---
    const comparedResults = Array.from(productGroups.values())
      // GOLD STANDARD FIX: Gebruik een custom type guard om TypeScript 100% te overtuigen.
      .filter((products): products is [Product, ...Product[]] => products.length > 0)
      .map(products => {
        products.sort((a, b) => a.price - b.price);
        // Door de type guard hierboven, weet TS nu dat `products[0]` altijd bestaat.
        const bestOffer = products[0];
        
        return {
          name: bestOffer.title,
          bestOffer: bestOffer,
          variants: products,
          variantCount: products.length,
        };
      })
      // Deze sort is nu ook veilig, want `bestOffer` kan niet meer undefined zijn.
      .sort((a, b) => a.bestOffer.price - b.bestOffer.price);

    await redis.set(cacheKey, JSON.stringify(comparedResults), { ex: 3600 });

    return NextResponse.json(comparedResults);

  } catch (err) {
    console.error('[API_COMPARE_PRICES_ERROR]', err);
    return NextResponse.json({ error: 'Internal server error during price comparison.' }, { status: 500 });
  }
}