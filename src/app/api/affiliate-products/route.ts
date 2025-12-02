import { NextRequest, NextResponse } from "next/server";
import { getAmazonProducts } from "@/src/lib/services/amazonService";
import { getBolProducts } from "@/src/lib/services/bolService";
import stringSimilarity from "string-similarity";
import { getAgeGroup, getGender, filterProducts } from "@/src/lib/services/productFilterService";
import { getCategoryProducts } from "@/src/lib/services/categoryService";

const dummyProducts = [
  {
    id: 1,
    title: "Smart Home Starter Kit",
    category: "Electronics",
    price: 129.99,
    ageGroup: "adult",
    gender: "unisex",
    tags: ["smart home", "technology", "gadgets"],
    Rating: 4.5,
    Reviews: 256,
    description: "Complete smart home automation system with voice control",
    URL: "https://example.com/smart-home-kit",
    ImageURL: "/api/placeholder/300/300",
  },
  // ... voeg alle dummyProducts toe zoals in je oude code
];

const mergeProductsByEan = (products: any[]) => {
  const productMap = new Map<string, any>();
  products.forEach((product) => {
    const ean = product.Ean || product.ean || null;
    if (!ean) return;
    if (productMap.has(ean)) {
      const existingProduct = productMap.get(ean);
      productMap.set(ean, {
        ...existingProduct,
        platforms: {
          ...existingProduct.platforms,
          [product.Source.toLowerCase()]: {
            URL: product.URL,
            Price: parseFloat(product.Price) || 0,
            Source: product.Source,
          },
        },
        Rating: Math.max(parseFloat(existingProduct.Rating || 0), parseFloat(product.Rating || 0)),
        Reviews: (parseInt(existingProduct.Reviews) || 0) + (parseInt(product.Reviews || product.Review || 0) || 0),
        hasMultiplePlatforms: true,
      });
    } else {
      productMap.set(ean, {
        ...product,
        platforms: {
          [product.Source.toLowerCase()]: {
            URL: product.URL,
            Price: parseFloat(product.Price) || 0,
            Source: product.Source,
          },
        },
        hasMultiplePlatforms: false,
      });
    }
  });
  return Array.from(productMap.values());
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || undefined;
  const category = searchParams.get("category") || undefined;
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
  const age = searchParams.get("age") || undefined;
  const gender = searchParams.get("gender") || undefined;
  const pageNumber = Number(searchParams.get("pageNumber")) || 1;

  try {
    let allProducts: any[] = [];

    if (!keyword) {
      allProducts = await getCategoryProducts(category, { minPrice, maxPrice, age, gender, pageNumber });
    } else {
      const [amazonProducts, bolProducts] = await Promise.allSettled([
        getAmazonProducts(keyword, category, minPrice, maxPrice, pageNumber, undefined, age, gender),
        getBolProducts(keyword, category, minPrice, maxPrice, pageNumber, age, gender, undefined),
      ]);

      allProducts = [
        ...(amazonProducts.status === "fulfilled" ? amazonProducts.value : []),
        ...(bolProducts.status === "fulfilled" ? bolProducts.value : []),
      ];
    }

    if (allProducts.length === 0) {
      allProducts = [];
    }

    const mergedProducts = mergeProductsByEan(allProducts.filter((i) => i.Price > minPrice && i.Price < maxPrice));

    mergedProducts.sort((a, b) => {
      if (a.hasMultiplePlatforms && !b.hasMultiplePlatforms) return -1;
      if (!a.hasMultiplePlatforms && b.hasMultiplePlatforms) return 1;
      return parseFloat(b.Rating || 0) - parseFloat(a.Rating || 0);
    });

    return NextResponse.json(mergedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products", products: dummyProducts }, { status: 500 });
  }
}
