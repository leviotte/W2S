'use server';

import { z } from 'zod';
import { productSchema, type Product } from '@/types/product';
// Hier zou je echte zoekfuncties importeren, bv. uit 'lib/amazon/search'
// import { searchAmazon } from '@/lib/amazon/search'; 

// Dummy data blijft voorlopig nuttig voor tests
const dummyProducts: Product[] = [
  {
    id: 'B09V3GZ7C4', source: 'Amazon', title: "Boek: Ontwaakt, Een nieuwe mindset van conditionering naar vrijheid.", url: 'https://www.amazon.nl/dp/B09V3GZ7C4', imageUrl: 'https://m.media-amazon.com/images/I/71XGSUf4c3L._AC_UY218_.jpg', price: 22.50, rating: 5, reviewCount: 10, category: 'Boeken',
  },
  {
    id: '9789044979261', source: 'Bol.com', title: 'Een Cursus in Wonderen', url: 'https://www.bol.com/nl/nl/p/een-cursus-in-wonderen/9200000109000000/', imageUrl: 'https://media.s-bol.com/g28lY5RqZzP9/550x780.jpg', price: 35.00, rating: 4.8, reviewCount: 42, category: 'Boeken',
  },
  {
    id: 'B08H95Y452', source: 'Amazon', title: 'Apple iPhone 12 Pro (128GB)', url: 'https://www.amazon.nl/dp/B08H95Y452', imageUrl: 'https://m.media-amazon.com/images/I/71MHTD3uL4L._AC_SX679_.jpg', price: 999.00, rating: 4.7, reviewCount: 1250, category: 'Elektronica',
  }
];

const SearchSchema = z.object({
  keyword: z.string().min(3, "Zoekterm moet minstens 3 karakters lang zijn."),
  page: z.number().int().positive().optional().default(1),
});

/**
 * Zoekt naar affiliate producten via een server action.
 * Dit wordt de ENIGE manier om producten te zoeken in de app.
 * @param keyword De zoekterm.
 * @param page Het paginanummer voor paginatie.
 * @returns Een object met producten en of er meer resultaten zijn.
 */
export async function searchAffiliateProducts(
  keyword: string,
  page: number = 1
): Promise<{ products: Product[]; hasMore: boolean; error?: string }> {
  
  const validation = SearchSchema.safeParse({ keyword, page });
  if (!validation.success) {
    return { products: [], hasMore: false, error: validation.error.errors[0].message };
  }

  console.log(`Server Action: Searching for '${keyword}' on page ${page}...`);

  try {
    // --- HIER KOMT JOUW ECHTE LOGICA ---
    // const { products, hasMore } = await searchAmazon({ keyword, page });
    // return { products, hasMore };
    // --- EINDE ECHTE LOGICA ---

    // Voor nu, filteren we de dummy data:
    const filteredProducts = dummyProducts.filter(p => 
      p.title.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Simuleer paginatie
    const itemsPerPage = 10;
    const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const hasMore = filteredProducts.length > page * itemsPerPage;

    return { products: paginatedProducts, hasMore };

  } catch (error) {
    console.error("Affiliate search failed:", error);
    return { products: [], hasMore: false, error: "Zoeken mislukt. Probeer het later opnieuw." };
  }
}