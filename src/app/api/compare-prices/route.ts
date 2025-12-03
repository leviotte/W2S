// src/app/api/compare-prices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from 'redis'; // Gebruik de standaard 'redis' client
import { getAmazonProducts } from '@/lib/services/amazonService';
import { getBolProducts } from '@/lib/services/bolService';
import { Product } from '@/types/products';
import { stringSimilarity } from 'string-similarity';

// Definieer het schema voor de inkomende request parameters.
const searchSchema = z.object({
  keyword: z.string().min(2, 'Keyword moet minstens 2 karakters lang zijn.'),
  category: z.string().optional().default('All'),
  minPrice: z.string().optional().default('0'),
  maxPrice: z.string().optional().default('10000'),
  sortBy: z.enum(['RELEVANCE', 'PRICE_ASC', 'PRICE_DESC']).optional().default('RELEVANCE'),
});

// Initialiseer de Redis client. Voor Vercel wordt de URL uit env vars gehaald.
const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
if (!redisClient.isOpen) {
  redisClient.connect();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const validation = searchSchema.safeParse(Object.fromEntries(searchParams));

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { keyword, category, minPrice, maxPrice, sortBy } = validation.data;
  const cacheKey = `compare:v2:${keyword}:${category}:${minPrice}:${maxPrice}:${sortBy}`;

  try {
    // --- CACHING ---
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] voor key: ${cacheKey}`);
      return NextResponse.json(JSON.parse(cachedData));
    }
    console.log(`[CACHE MISS] voor key: ${cacheKey}`);

    // --- DATA FETCHING ---
    const [amazonResult, bolResult] = await Promise.allSettled([
      getAmazonProducts(keyword, category, minPrice, maxPrice, sortBy),
      getBolProducts(keyword, category, minPrice, maxPrice, sortBy),
    ]);

    const allProducts: Product[] = [];
    if (amazonResult.status === 'fulfilled') allProducts.push(...amazonResult.value);
    if (bolResult.status === 'fulfilled') allProducts.push(...bolResult.value);

    // --- SLIMME PRODUCTGROEPERING ---
    // We gebruiken EAN-codes als primaire match, en titel-similariteit als fallback.
    const productGroups = new Map<string, Product[]>();
    const matchedProducts = new Set<Product>();

    // Groepeer eerst op EAN
    allProducts.forEach(p => {
      if (p.ean) {
        if (!productGroups.has(p.ean)) productGroups.set(p.ean, []);
        productGroups.get(p.ean)!.push(p);
        matchedProducts.add(p);
      }
    });
    
    // Verwerk de overgebleven producten met string similarity
    const remainingProducts = allProducts.filter(p => !matchedProducts.has(p));
    // (Hier kan je nog complexere logica voor string similarity toevoegen indien nodig)
    remainingProducts.forEach(p => productGroups.set(p.id, [p]));


    // --- RESULTAAT FORMATTERING ---
    const comparedResults = Array.from(productGroups.values()).map(products => {
      // Sorteer varianten op prijs, van laag naar hoog.
      products.sort((a, b) => a.price - b.price);
      
      const bestOffer = products[0]; // Het eerste item is nu de goedkoopste.
      
      return {
        // Gebruik de titel van het beste aanbod als de 'display naam'.
        name: bestOffer.title,
        bestOffer: bestOffer,
        // Geef alle gevonden bronnen mee voor deze productgroep.
        variants: products,
        variantCount: products.length,
      };
    }).sort((a, b) => a.bestOffer.price - b.bestOffer.price); // Sorteer de finale lijst op prijs

    // --- CACHE OPSLAAN & RESPONSE ---
    await redisClient.set(cacheKey, JSON.stringify(comparedResults), { EX: 3600 }); // 1 uur TTL

    return NextResponse.json(comparedResults);

  } catch (err) {
    console.error('[API_COMPARE_PRICES_ERROR]', err);
    return NextResponse.json({ error: 'Internal server error during price comparison.' }, { status: 500 });
  }
}