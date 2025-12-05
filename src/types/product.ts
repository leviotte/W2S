// src/types/product.ts

/**
 * Opties voor het bevragen van producten over verschillende services.
 * Dit is onze gestandaardiseerde manier om filters en zoekopdrachten door te geven.
 */
export interface ProductQueryOptions {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  age?: string; // We houden dit als string voor flexibiliteit
  gender?: string; // Idem
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'Relevance' | 'PRICE_ASC' | 'PRICE_DESC';
}

/**
 * De gestandaardiseerde interface voor een product binnen Wish2Share.
 * Elk product van elke bron (Amazon, Bol, etc.) wordt naar dit formaat gemapt.
 */
export interface Product {
  id: string; // Unieke identifier van de bron (ASIN, Bol ID, etc.)
  source: 'Amazon' | 'Bol.com' | 'Internal';
  title: string;
  url: string;
  imageUrl: string;
  price: number;
  ean?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  // Wordt gebruikt na het mergen
  platforms?: Record<string, { URL: string; Price: number; Source: string }>;
  hasMultiplePlatforms?: boolean;
}