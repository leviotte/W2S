// src/app/api/compare-prices/route.ts
import { NextResponse } from 'next/server';
import { searchProductsOnPlatforms } from '@/lib/services/productFilterService';
import { productQueryOptionsSchema, Product } from '@/types/product';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Valideer de inkomende search params tegen ons Zod schema
    const validationResult = productQueryOptionsSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validationResult.error.flatten() }, { status: 400 });
    }

    const options = validationResult.data;

    // We gebruiken nu 'query' in plaats van 'keyword'
    if (!options.query || options.query.length < 2) {
      return NextResponse.json({ error: 'A search query of at least 2 characters is required.' }, { status: 400 });
    }

    const results: Product[] = await searchProductsOnPlatforms(options);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in compare-prices API:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}