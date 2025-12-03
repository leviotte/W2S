// src/types/product.ts

/**
 * Gestandaardiseerde productinterface voor alle externe services (Bol, Amazon, etc.)
 */
export interface Product {
  source: 'Amazon' | 'Bol.com'; // De bron van het product
  id: string;                    // Uniek ID van de bron (ASIN voor Amazon, bolProductId voor Bol)
  title: string;                 // Volledige producttitel
  url: string;                   // De (affiliate) URL naar het product
  imageUrl: string;              // URL van de productafbeelding
  price: number;                 // Prijs als een numerieke waarde
  ean?: string | null;           // EAN-code, indien beschikbaar
  rating?: number | null;        // Gemiddelde rating (bv. 4.5)
  reviewCount?: number | null;   // Aantal reviews
}