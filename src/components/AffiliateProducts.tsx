"use client";
import React from "react";
import { useAmazonSearch } from "@/hooks/useAmazonSearch";

interface FilterProps {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  age?: string;
  gender?: string;
}

interface AffiliateProductsProps {
  filters: FilterProps;
}

export const AffiliateProducts: React.FC<AffiliateProductsProps> = ({ filters }) => {
  const { products, loading, error, loadMore, hasMore } = useAmazonSearch(filters);

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="affiliate-products">
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.ID} className="product-card">
            <img src={product.ImageURL} alt={product.Title} />
            <h3>{product.Title}</h3>
            <div className="price">€{product.Price}</div>
            <div className="ratings">
              <span>★ {product.Rating}</span>
              <span>({product.Reviews} reviews)</span>
            </div>
            <div className="store-links">
              {product.platforms?.bol && (
                <a href={product.platforms.bol.URL} target="_blank" rel="noopener noreferrer" className="bol-button">
                  View on Bol.com
                </a>
              )}
              {product.platforms?.amz && (
                <a href={product.platforms.amz.URL} target="_blank" rel="noopener noreferrer" className="amazon-button">
                  View on Amazon
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="loading">Loading...</div>}
      {hasMore && !loading && (
        <button onClick={loadMore} className="load-more">
          Load More
        </button>
      )}
    </div>
  );
};
