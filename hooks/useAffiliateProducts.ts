"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Product } from "../lib/services/productFilterService";

interface AffiliateFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  age?: string;
  gender?: string;
}

interface UseAffiliateProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  setFilters: (filters: AffiliateFilters) => void;
}

export const useAffiliateProducts = (initialFilters?: AffiliateFilters): UseAffiliateProductsResult => {
  const [filters, setFilters] = useState<AffiliateFilters>(initialFilters || {});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<Product[]>("/api/affiliate-products", {
        params: { ...filters, pageNumber: page },
      });

      const newProducts = res.data;

      setProducts((prev) =>
        page === 1 ? newProducts : [...prev, ...newProducts]
      );
      setHasMore(newProducts.length > 0);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch affiliate products");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    setPage(1); // reset page when filters change
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loadMore = () => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  };

  return { products, loading, error, hasMore, loadMore, setFilters };
};
