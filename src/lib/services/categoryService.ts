// src/lib/services/categoryService.ts
import { Product, ProductQueryOptions } from '@/types/product';
import { filterAndSearchProducts } from './productFilterService';
import dummyProducts from '@/lib/mock-data/dummyProducts';

export const getCategoryProducts = async (
  category: string,
  options: ProductQueryOptions // Gebruikt nu de gestandaardiseerde options
): Promise<Product[]> => {
  let products = dummyProducts.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  
  // Update de options met de categorie voor de filterfunctie
  const filterOptions = { ...options, category };

  products = filterAndSearchProducts(products, filterOptions);
  
  return products;
};