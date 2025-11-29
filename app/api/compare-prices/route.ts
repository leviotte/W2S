import { NextRequest, NextResponse } from "next/server";
import redisClient from "../../../lib/redis";
import { getAmazonProducts } from "../../../services/amazonService";
import { getBolProducts } from "../../../services/bolService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "0";
  const maxPrice = searchParams.get("maxPrice") || "10000";
  const sortBy = searchParams.get("sortBy") || "RELEVANCE";

  const cacheKey = `compare:${keyword}:${category}:${minPrice}:${maxPrice}:${sortBy}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const [amazonProducts, bolProducts] = await Promise.allSettled([
      getAmazonProducts(keyword, category, minPrice, maxPrice, sortBy),
      getBolProducts(keyword, category, minPrice, maxPrice, sortBy),
    ]);

    let allProducts = [
      ...(amazonProducts.status === "fulfilled" ? amazonProducts.value : []),
      ...(bolProducts.status === "fulfilled" ? bolProducts.value : []),
    ];

    allProducts = allProducts.map((p) => ({
      ...p,
      Price: p.Price ? parseFloat(String(p.Price)) : 0,
    }));

    const productComparison: Record<string, any[]> = {};

    allProducts.forEach((p) => {
      if (!p.Title) return;
      const name = p.Title.toLowerCase().trim();
      if (!productComparison[name]) productComparison[name] = [];
      productComparison[name].push(p);
    });

    const comparedProducts = Object.keys(productComparison).map((name) => {
      const products = productComparison[name];
      const cheapest = products.reduce((a, b) => (b.Price < a.Price ? b : a));
      const mostExpensive = products.reduce((a, b) => (b.Price > a.Price ? b : a));
      return {
        name,
        cheapest,
        mostExpensive,
      };
    });

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(comparedProducts));
    return NextResponse.json(comparedProducts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to compare prices" }, { status: 500 });
  }
}
