// src/components/blog/AffiliateProductSearch.tsx
"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Product } from '@/types/product';
import { searchAffiliateProducts } from '@/lib/actions/product-actions';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AffiliateProductSearchProps {
  // Dit is de callback functie die de typefout oplost!
  onProductSelected: (product: Product) => void;
}

export function AffiliateProductSearch({ onProductSelected }: AffiliateProductSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const [isSearching, startSearchTransition] = useTransition();
  const [isLoadingMore, startLoadMoreTransition] = useTransition();

  const handleSearch = (loadMore = false) => {
    const transition = loadMore ? startLoadMoreTransition : startSearchTransition;
    
    transition(async () => {
      if (!keyword.trim()) {
        toast.warning('Voer een zoekterm in.');
        return;
      }
      
      const targetPage = loadMore ? page + 1 : 1;
      
      try {
        const { products: newProducts, hasMore: newHasMore } = await searchAffiliateProducts(keyword, targetPage);
        
        if (!loadMore && newProducts.length === 0) {
          toast.info('Geen producten gevonden voor deze zoekopdracht.');
        }

        setResults(prev => loadMore ? [...prev, ...newProducts] : newProducts);
        setHasMore(newHasMore);
        setPage(targetPage);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Er ging iets mis bij het zoeken naar producten.');
      }
    });
  };
  
  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(false);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="text-lg font-semibold">Zoek Affiliate Product</h3>
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Zoek een product (bv. 'ontwaakt')..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={isSearching || isLoadingMore}
        />
        <Button type="submit" disabled={isSearching || isLoadingMore || !keyword.trim()}>
          {(isSearching && !isLoadingMore) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zoek
        </Button>
      </form>
      
      <ScrollArea className="h-96">
        {!isSearching && results.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Zoekresultaten verschijnen hier.</p>
          </div>
        )}
        
        {isSearching && results.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {results.map((product) => (
            <Card key={`${product.id}-${page}`} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-medium line-clamp-2">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="relative aspect-square w-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="rounded-md object-contain"
                  />
                </div>
                <p className="text-lg font-bold">€{product.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm" onClick={() => onProductSelected(product)}>
                  Voeg toe
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {hasMore && (
          <div className="mt-4 flex justify-center pr-4">
            <Button onClick={() => handleSearch(true)} variant="secondary" disabled={isLoadingMore}>
              {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Meer laden
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}