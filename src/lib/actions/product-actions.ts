// src/lib/actions/product-actions.ts
'use server';

import { Product } from '@/types/product';
// We importeren het Product type dat je zelf zo perfect hebt gedefinieerd.

// Placeholder voor een zoekresultaat, nu conform jouw uitgebreide Product schema.
const dummyProduct: Product = {
  id: 'B09V3GZ7C4', // ASIN van Amazon
  source: 'Amazon',
  title: 'Boek: Ontwaakt, Een nieuwe mindset van conditionering naar vrijheid.',
  url: 'https://www.amazon.nl/dp/B09V3GZ7C4',
  imageUrl: 'https://m.media-amazon.com/images/I/71XGSUf4c3L._AC_UY218_.jpg',
  price: 22.50,
  rating: 5,
  reviewCount: 10,
  category: 'Boeken',
};

const anotherDummyProduct: Product = {
    id: '9789044979261', // EAN van Bol.com
    source: 'Bol.com',
    title: 'Een Cursus in Wonderen',
    url: 'https://www.bol.com/nl/nl/p/een-cursus-in-wonderen/9200000109000000/',
    imageUrl: 'https://media.s-bol.com/g28lY5RqZzP9/550x780.jpg',
    price: 35.00,
    rating: 4.8,
    reviewCount: 42,
    category: 'Boeken',
}

/**
 * Zoekt naar affiliate producten via een server action.
 * @param keyword De zoekterm.
 * @param page De paginanummer voor paginatie.
 * @returns Een object met producten en of er meer resultaten zijn.
 */
export async function searchAffiliateProducts(
  keyword: string,
  page: number = 1
): Promise<{ products: Product[]; hasMore: boolean }> {
  console.log(`Searching for '${keyword}' on page ${page}...`);

  if (!keyword.trim()) {
    return { products: [], hasMore: false };
  }

  // --- HIER KOMT JOUW ECHTE LOGICA ---
  // Dit is waar je de `searchAmazon` of `searchBol` functie zou aanroepen.
  // Voor nu, retourneren we dummy data.
  if (keyword.toLowerCase().includes('ontwaakt') && page === 1) {
    return {
      products: [dummyProduct],
      hasMore: true, // Zeggen dat er meer is om de knop te tonen
    };
  }
  
  if (page > 1) {
    return {
        products: [anotherDummyProduct],
        hasMore: false, // geen pagina's meer
    }
  }
  // --- EINDE ECHTE LOGICA ---

  return { products: [], hasMore: false };
}