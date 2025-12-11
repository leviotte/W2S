// src/components/products/affiliate-product-search-dialog.tsx
"use client";

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';
import { Loader2, Search } from 'lucide-react';

import type { Product } from '@/types/product';
import { searchAffiliateProducts } from '@/lib/actions/product-actions';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// CORRECTIE: Props aangepast voor duidelijkheid en consistentie.
interface AffiliateProductSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelected: (product: Product) => void;
}

export function AffiliateProductSearchDialog({
  isOpen,
  onOpenChange,
  onProductSelected,
}: AffiliateProductSearchDialogProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const [isSearching, startSearchTransition] = useTransition();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const handleSearch = (term: string, loadMore = false) => {
    const targetPage = loadMore ? page + 1 : 1;
    
    startSearchTransition(async () => {
      if (!term.trim() || term.length < 3) {
        setResults([]);
        setHasMore(false);
        return;
      }
      
      const { products: newProducts, hasMore: newHasMore, error } = await searchAffiliateProducts(term, targetPage);

      if (error) {
          toast.error(error);
          return;
      }

      setResults(prev => loadMore ? [...prev, ...newProducts] : newProducts);
      setHasMore(newHasMore);
      setPage(targetPage);
    });
  };

  useEffect(() => {
    // We roepen handleSearch aan wanneer de gedebounced term verandert.
    handleSearch(debouncedSearchTerm, false);
  }, [debouncedSearchTerm]);

  const handleSelectProduct = (product: Product) => {
  onProductSelected(product);
  onOpenChange(false); // sluit dialog
  toast.success(`"${product.title}" toegevoegd!`);
};

  // Reset de state wanneer de dialoog sluit.
  useEffect(() => {
    if (!isOpen) {
      // Een kleine vertraging om te voorkomen dat de content "verdwijnt" voor de sluit-animatie.
      setTimeout(() => {
        setSearchTerm('');
        setResults([]);
        setHasMore(false);
        setPage(1);
      }, 300);
    }
  }, [isOpen]);

  return (
    // CORRECTIE: onOpenChange van de Dialog component wordt gekoppeld aan onze onClose prop.
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Zoek een Product</DialogTitle>
          <DialogDescription>
            Zoek naar producten van onze partners om toe te voegen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Zoek een product (bv. 'ontwaakt')..."
            value={searchTerm}
            // CORRECTIE: Juiste JSX syntax voor onChange
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <ScrollArea className="flex-grow">
          <div className="p-1">
            {isSearching && results.length === 0 && (
              <div className="flex h-full min-h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
             {!isSearching && results.length === 0 && debouncedSearchTerm.length > 2 && (
              <div className="flex h-full min-h-64 items-center justify-center">
                  <p className="text-sm text-muted-foreground">Geen resultaten gevonden.</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((product) => (
                <Card key={product.id} className="flex flex-col">
                  <CardContent className="p-4 flex-grow">
                    <div className="relative aspect-square w-full mb-4">
                      <Image src={product.imageUrl} alt={product.title} fill sizes="33vw" className="rounded-md object-contain" />
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{product.title}</p>
                    <p className="text-lg font-bold">€{product.price.toFixed(2)}</p>
                  </CardContent>
                  <CardFooter className="p-2">
                    {/* CORRECTIE: Juiste JSX syntax voor onClick */}
                    <Button className="w-full" size="sm" onClick={() => handleSelectProduct(product)}>
                      Voeg toe
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {hasMore && !isSearching && (
              <div className="mt-4 flex justify-center">
                {/* CORRECTIE: Juiste JSX syntax voor onClick */}
                <Button onClick={() => handleSearch(debouncedSearchTerm, true)} variant="secondary">
                  Meer laden
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}