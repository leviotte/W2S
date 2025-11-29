import { Product, filterAndSearchProducts, AgeGroup, Gender } from "./productFilterService";
import dummyProducts from "../../data/dummyProducts";

interface CategoryFilterOptions {
  minPrice?: number;
  maxPrice?: number;
  age?: AgeGroup;
  gender?: Gender;
  keyword?: string;
  pageNumber?: number;
}

export const getCategoryProducts = async (
  category: string,
  options: CategoryFilterOptions
): Promise<Product[]> => {
  try {
    // Simuleer API/database call
    let products = dummyProducts.filter((p) => p.Category?.toLowerCase() === category.toLowerCase());
    products = filterAndSearchProducts(products, options);
    return products;
  } catch (err) {
    console.error("CategoryService Error:", err);
    return dummyProducts;
  }
};
