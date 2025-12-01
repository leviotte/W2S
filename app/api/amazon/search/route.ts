import { NextRequest, NextResponse } from "next/server";
import { getAmazonProducts } from "@/lib/services/amazonService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.url ? new URL(req.url) : { searchParams: new URLSearchParams() };

    // Query params
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "All";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const age = (searchParams.get("age") as keyof typeof import("@/lib/services/amazonService").ageGenderMapping) || undefined;
    const gender = (searchParams.get("gender") as "women" | "men" | "unisex") || undefined;

    if (!keyword) {
      return NextResponse.json({ products: [], error: "No keyword provided" }, { status: 400 });
    }

    const products = await getAmazonProducts(keyword, category, undefined, undefined, page, pageSize, age, gender);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("❌ Amazon API route error:", error);
    return NextResponse.json({ products: [], error: "Internal server error" }, { status: 500 });
  }
}
