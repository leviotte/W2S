// src/components/blog/product-card.tsx
import Image from 'next/image';
import { type Product } from '@/types/product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Zorg voor een fallback als de prijs niet numeriek is of ontbreekt.
  const displayPrice = typeof product.price === 'number' 
    ? `€${product.price.toFixed(2)}` 
    : (product.price || 'Prijs op aanvraag');

  // Fallback voor de afbeelding als 'imageUrl' ontbreekt maar 'ImageURL' wel bestaat
  const imageUrl = product.imageUrl || '/placeholder-image.png';

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={imageUrl}
            alt={product.title || 'Product afbeelding'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-md font-semibold leading-snug">
          {product.title}
        </CardTitle>
        <p className="mt-2 text-lg font-bold text-gray-800">{displayPrice}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <a href={product.url || '#'} target="_blank" rel="noopener noreferrer sponsored">
            Bekijk product <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}