// src/lib/services/productFilterService.ts
import { Product, ProductQueryOptions } from '@/types/product';
import { getAmazonProducts } from './amazonService';
import { getBolProducts } from './bolService';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// De functie die onze API routes nodig hebben!
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
      const key = product.ean || product.id.toString(); // Gebruik EAN als primaire sleutel, anders product-ID
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
    // Return een lege array bij een fout om de applicatie niet te laten crashen
    return []; 
  }
}

// Oude functies kunnen we hier eventueel later verwijderen of refactoren.
// Voor nu laten we ze staan als ze elders nog gebruikt worden,
// maar de focus ligt op searchProductsOnPlatforms.