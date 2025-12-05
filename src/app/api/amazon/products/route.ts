import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import { getAmazonProducts, ageGenderMapping } from "@/lib/services/amazonService";

// Stap 1: Definieer de lijst van toegestane keys. Dit is correct.
const ageKeys = Object.keys(ageGenderMapping) as [string, ...string[]];

// Stap 2: Definieer het schema dat deze keys gebruikt voor validatie. Dit is correct.
const searchSchema = z.object({
  keyword: z.string().min(1, "Keyword is verplicht."),
  category: z.string().optional().default("All"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).optional().default(10),
  age: z.enum(ageKeys).optional(),
  gender: z.enum(["women", "men", "unisex"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const validation = searchSchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ products: [], error: "Invalide parameters", details: validation.error.flatten() }, { status: 400 });
    }
    
    // --- DIT IS DE CRUCIALE STAP ---
    // Gebruik ALTIJD de 'data' property van het 'validation' object.
    // De 'age' en 'gender' variabelen hier zijn nu 100% type-safe.
    const { keyword, category, page, pageSize, age, gender } = validation.data;

    // Roep de service aan met het object dat enkel de veilige, gevalideerde data bevat.
    // TypeScript is nu blij, omdat 'age' hier gegarandeerd het juiste type heeft.
    const products = await getAmazonProducts({
        keyword,
        category,
        page,
        pageSize,
        age, // Geen 'as ...' cast meer nodig, Zod en TS doen het werk!
        gender,
    });

    return NextResponse.json({ products });

  } catch (error) {
    console.error("❌ Amazon API route error:", error);
    return NextResponse.json({ products: [], error: "Internal server error" }, { status: 500 });
  }
}