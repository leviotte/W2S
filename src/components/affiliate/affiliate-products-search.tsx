'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { Filter, PlusCircle, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { AmazonProduct, AmazonCategory, AmazonSortOption } from '@/types/affiliate';

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  onAddProduct: (product: AmazonProduct) => void;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AffiliateProductsSearch({ onAddProduct }: Props) {
  // State
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search params
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<AmazonCategory>('All');
  const [sortBy, setSortBy] = useState<AmazonSortOption>('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  // Debounced keyword voor auto-search
  const [debouncedKeyword] = useDebounce(keyword, 500);

  // ============================================================================
  // FETCH PRODUCTS
  // ============================================================================

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      
      if (keyword) params.set('keyword', keyword);
      if (category !== 'All') params.set('category', category);
      if (sortBy) params.set('sortBy', sortBy);
      if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());

      const response = await fetch(`/api/amazon/products?${params.toString()}`);
      
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Producten ophalen mislukt');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, category, sortBy, minPrice, maxPrice]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearch = () => {
    fetchProducts();
  };

  const handleAddProduct = (product: AmazonProduct) => {
    onAddProduct(product);
    toast.success(`${product.Title.substring(0, 30)}... toegevoegd!`);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setMinPrice(value === '' ? undefined : Math.max(0, Number(value)));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setMaxPrice(value === '' ? undefined : Math.max(0, Number(value)));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="border-t border-gray-200 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Affiliate Producten Toevoegen
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-accent/10' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Zoek producten..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Categorie</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as AmazonCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Alle Categorieën</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Baby">Baby</SelectItem>
                <SelectItem value="Beauty">Beauty & Parfums</SelectItem>
                <SelectItem value="Books">Boeken</SelectItem>
                <SelectItem value="Computers">Computers</SelectItem>
                <SelectItem value="Electronics">Elektronica</SelectItem>
                <SelectItem value="Fashion">Kleding & Schoenen</SelectItem>
                <SelectItem value="VideoGames">Videogames</SelectItem>
                <SelectItem value="ToysAndGames">Speelgoed & Games</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Prijsrange</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                placeholder="Min €"
                value={minPrice ?? ''}
                onChange={handleMinPriceChange}
                className="flex-1"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                min={0}
                placeholder="Max €"
                value={maxPrice ?? ''}
                onChange={handleMaxPriceChange}
                className="flex-1"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label>Sorteren op</Label>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as AmazonSortOption)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standaard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Standaard</SelectItem>
                <SelectItem value="NewestArrivals">Nieuwste</SelectItem>
                <SelectItem value="Price:LowToHigh">Prijs: Laag naar Hoog</SelectItem>
                <SelectItem value="Price:HighToLow">Prijs: Hoog naar Laag</SelectItem>
                <SelectItem value="Featured">Uitgelicht</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.ASIN}
                product={product}
                onAdd={handleAddProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {keyword ? 'Geen producten gevonden' : 'Voer een zoekterm in'}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRODUCT CARD SUB-COMPONENT
// ============================================================================

type ProductCardProps = {
  product: AmazonProduct;
  onAdd: (product: AmazonProduct) => void;
};

function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col">
      {/* Image */}
      <div className="relative w-full h-32 mb-3">
        {product.ImageURL ? (
          <Image
            src={product.ImageURL}
            alt={product.Title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Geen afbeelding</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 flex-grow">
        {product.Title}
      </h4>

      {/* Price Info */}
      <div className="space-y-1 mb-3">
        {product.PriceWithoutSaving && (
          <p className="text-xs text-gray-500 line-through">
            {product.PriceWithoutSaving}
          </p>
        )}
        {product.Price && (
          <p className="text-lg font-bold text-accent">
            {product.Price}
          </p>
        )}
        {product.Saving && (
          <p className="text-xs text-red-600">
            Bespaar {product.Saving}
          </p>
        )}
      </div>

      {/* Add Button */}
      <Button
        type="button"
        size="sm"
        onClick={() => onAdd(product)}
        className="w-full"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Toevoegen
      </Button>
    </div>
  );
}