import { useState, useEffect } from "react";

interface FilterProps {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  age?: string;
  gender?: string;
}

export const useAmazonSearch = (filters: FilterProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ ...filters, pageNumber: page.toString() });
      const res = await fetch(`/api/affiliate-products?${query}`);
      const data = await res.json();
      setProducts((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(data.length >= 10); // simple check for pagination
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  };

  return { products, loading, error, loadMore, hasMore };
};
