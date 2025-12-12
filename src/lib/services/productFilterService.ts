// src/lib/services/productFilterService.ts
import { Product, ProductQueryOptions } from '@/types/product';
import { getAmazonProducts } from './amazonService';
import { getBolProducts } from './bolService';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// ============================================================================
// SEARCH PRODUCTS ON PLATFORMS (met caching)
// ============================================================================

export async function searchProductsOnPlatforms(options: ProductQueryOptions): Promise<Product[]> {
  // Bouw een dynamische cache key gebaseerd op de query opties
  const cacheKey = `products:${JSON.stringify(options)}`;

  try {
    const cachedData = await redis.get<Product[]>(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] voor product search: ${cacheKey}`);
      return cachedData;
    }
    console.log(`[CACHE MISS] voor product search: ${cacheKey}`);

    // Voer de zoekopdrachten parallel uit
    const [amazonResult, bolResult] = await Promise.allSettled([
      getAmazonProducts(options),
      getBolProducts(options),
    ]);

    let allProducts: Product[] = [];
    if (amazonResult.status === 'fulfilled' && amazonResult.value) {
      allProducts.push(...amazonResult.value);
    }
    if (bolResult.status === 'fulfilled' && bolResult.value) {
      allProducts.push(...bolResult.value);
    }
    
    // Voorkom dubbele producten op basis van EAN als die bestaat
    const uniqueProducts = new Map<string, Product>();
    allProducts.forEach(product => {
      const key = product.ean || product.id.toString();
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      }
    });

    const finalProducts = Array.from(uniqueProducts.values());

    // Sla het resultaat op in de cache voor 1 uur
    await redis.set(cacheKey, JSON.stringify(finalProducts), { ex: 3600 });

    return finalProducts;

  } catch (error) {
    console.error('Fout in searchProductsOnPlatforms:', error);
    return []; 
  }
}

// ============================================================================
// FILTER AND SEARCH PRODUCTS (voor categoryService)
// ============================================================================

/**
 * ✅ FIXED: Filter en zoek producten lokaal (aligned met ProductQueryOptions)
 */
export function filterAndSearchProducts(
  products: Product[],
  options: ProductQueryOptions
): Product[] {
  let filtered = [...products];

  // ✅ Filter op query (was keyword)
  if (options.query) {
    const lowerQuery = options.query.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  }

  // Filter op categorie
  if (options.category) {
    filtered = filtered.filter(p =>
      p.category?.toLowerCase() === options.category?.toLowerCase()
    );
  }

  // Filter op prijs
  if (options.minPrice !== undefined) {
    filtered = filtered.filter(p => p.price >= options.minPrice!);
  }
  if (options.maxPrice !== undefined) {
    filtered = filtered.filter(p => p.price <= options.maxPrice!);
  }

  // ✅ Filter op age (was ageGroup)
  if (options.age) {
    filtered = filtered.filter(p => p.ageGroup === options.age);
  }

  // Filter op gender
  if (options.gender) {
    filtered = filtered.filter(p => p.gender === options.gender);
  }

  // ✅ Paginering met offset/limit (was page-based)
  const offset = options.offset || 0;
  const limit = options.limit || 20;
  const endIndex = offset + limit;

  return filtered.slice(offset, endIndex);
}

// ============================================================================
// HELPER: GET TOTAL COUNT (voor pagination)
// ============================================================================

/**
 * Helper om het totaal aantal gefilterde producten te krijgen (zonder pagination)
 */
export function getFilteredProductCount(
  products: Product[],
  options: Omit<ProductQueryOptions, 'limit' | 'offset'>
): number {
  let filtered = [...products];

  if (options.query) {
    const lowerQuery = options.query.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  }

  if (options.category) {
    filtered = filtered.filter(p =>
      p.category?.toLowerCase() === options.category?.toLowerCase()
    );
  }

  if (options.minPrice !== undefined) {
    filtered = filtered.filter(p => p.price >= options.minPrice!);
  }

  if (options.maxPrice !== undefined) {
    filtered = filtered.filter(p => p.price <= options.maxPrice!);
  }

  if (options.age) {
    filtered = filtered.filter(p => p.ageGroup === options.age);
  }

  if (options.gender) {
    filtered = filtered.filter(p => p.gender === options.gender);
  }

  return filtered.length;
}