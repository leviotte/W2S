export type AgeGroup = "child" | "teen" | "adult" | "senior" | undefined;
export type Gender = "male" | "female" | "unisex" | undefined;

export interface Product {
  ID?: string | number;
  Title: string;
  Category?: string;
  Price: number;
  AgeGroup?: AgeGroup;
  Gender?: Gender;
  Tags?: string[];
  Rating?: number;
  Reviews?: number;
  Description?: string;
  URL?: string;
  ImageURL?: string;
  platforms?: Record<string, { URL: string; Price: number; Source: string }>;
}

// Helper: bepaal age group van een leeftijd
export const getAgeGroup = (age?: number): AgeGroup => {
  if (age === undefined) return undefined;
  if (age <= 12) return "child";
  if (age <= 18) return "teen";
  if (age <= 60) return "adult";
  return "senior";
};

// Helper: valideer gender
export const getGender = (gender?: string): Gender => {
  if (!gender) return undefined;
  const g = gender.toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "unisex";
};

// Filter producten op prijs, leeftijd, gender, categorie
export const filterProducts = (
  products: Product[],
  {
    minPrice = 0,
    maxPrice = Infinity,
    age,
    gender,
    category,
  }: { minPrice?: number; maxPrice?: number; age?: AgeGroup; gender?: Gender; category?: string }
): Product[] => {
  return products.filter((p) => {
    if (p.Price < minPrice || p.Price > maxPrice) return false;
    if (age && p.AgeGroup && p.AgeGroup !== age) return false;
    if (gender && p.Gender && p.Gender !== gender && p.Gender !== "unisex") return false;
    if (category && p.Category && p.Category.toLowerCase() !== category.toLowerCase()) return false;
    return true;
  });
};

// Zoek producten via keywords en vergelijk met tags/title
export const searchProducts = (products: Product[], keyword?: string): Product[] => {
  if (!keyword) return products;
  const lowerKeyword = keyword.toLowerCase();

  return products.filter((p) => {
    if (p.Title.toLowerCase().includes(lowerKeyword)) return true;
    if (p.Tags && p.Tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))) return true;
    if (p.Description && p.Description.toLowerCase().includes(lowerKeyword)) return true;
    return false;
  });
};

// Combineer filters + zoekfunctie
export const filterAndSearchProducts = (
  products: Product[],
  options: { minPrice?: number; maxPrice?: number; age?: AgeGroup; gender?: Gender; category?: string; keyword?: string }
): Product[] => {
  let filtered = filterProducts(products, options);
  filtered = searchProducts(filtered, options.keyword);
  return filtered;
};
