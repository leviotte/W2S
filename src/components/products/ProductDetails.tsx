// src/components/products/ProductDetails.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductWithInclusion } from '@/types/product';
import ProductImageCarousel from '../shared/ProductImageCarousel';

type ProductImage = { url: string; alt?: string };

interface ProductDetailsProps {
  product: ProductWithInclusion;
  setModal: (open: boolean) => void;
  setActiveProduct?: (prod: ProductWithInclusion | null) => void;
  addItemToWishlist?: (prod: ProductWithInclusion) => void;
  handleDeleteItem?: (id: string | number) => void;
}

export default function ProductDetails({
  product,
  setModal,
  setActiveProduct,
  addItemToWishlist,
  handleDeleteItem,
}: ProductDetailsProps) {
  // Altijd consistent: images[] ophalen, fallback naar imageUrl
  const images: ProductImage[] = useMemo(() => {
    const out: ProductImage[] = [];
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(url => {
        if (url && !out.some(img => img.url === url)) out.push({ url, alt: product.title });
      });
    }
    if ((!out.length) && product.imageUrl) out.push({ url: product.imageUrl, alt: product.title });
    return out;
  }, [product]);
  const [current, setCurrent] = useState(0);

  const prevImg = () => setCurrent(current => Math.max(current - 1, 0));
  const nextImg = () => setCurrent(current => Math.min(current + 1, images.length - 1));

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2"
      onClick={() => { setModal(false); setActiveProduct?.(null); }}
    >
      <div
        className="bg-white max-w-lg w-full rounded-lg shadow-lg p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Sluitknop */}
        <button
          className="absolute right-2 top-2 rounded hover:bg-gray-200 p-1"
          onClick={() => { setModal(false); setActiveProduct?.(null); }}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Productafbeelding(en) */}
        <div className="w-full flex flex-col items-center">
          <div className="relative w-60 h-60 bg-gray-100 rounded-lg overflow-hidden mb-4">
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full shadow border p-1"
                  onClick={e => { e.stopPropagation(); prevImg(); }}
                  disabled={current === 0}
                  aria-label="Vorige afbeelding"
                >
                  <ChevronLeft />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full shadow border p-1"
                  onClick={e => { e.stopPropagation(); nextImg(); }}
                  disabled={current === images.length - 1}
                  aria-label="Volgende afbeelding"
                >
                  <ChevronRight />
                </button>
              </>
            )}
            <Image
              src={images[current]?.url || '/placeholder.png'}
              alt={images[current]?.alt || 'Productafbeelding'}
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 640px) 100vw, 384px"
              className="rounded-lg"
            />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-1 mb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`w-4 h-4 rounded-full ${i === current ? "bg-warm-olive" : "bg-gray-300"}`}
                  style={{ border: i === current ? "2px solid #606c38" : undefined }}
                  onClick={e => { e.stopPropagation(); setCurrent(i); }}
                  aria-label={`Ga naar afbeelding ${i + 1}`}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-lg font-bold">{product.title}</h3>
          <div className="flex items-center gap-3 mt-2 mb-1">
            <span className="font-semibold text-warm-olive text-lg">€{Number(product.price).toFixed(2)}</span>
            {product.rating && (
              <span className="text-sm bg-warm-olive/20 text-warm-olive px-2 py-1 rounded-full font-semibold">{product.rating} ★</span>
            )}
            {product.reviewCount && (
              <span className="text-xs text-gray-500">({product.reviewCount} reviews)</span>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-gray-700 mt-1 mb-1 line-clamp-6">{product.description}</p>
          )}
          {product.category && (
            <p className="text-xs text-gray-500">Categorie: {product.category}</p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-2 mt-3">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto rounded px-4 py-2 bg-warm-olive text-white text-center hover:bg-cool-olive transition-colors font-semibold"
          >
            Bekijk bij {product.source || "verkoper"}
          </a>
          {addItemToWishlist && !product.isIncluded && (
            <Button
              onClick={() => addItemToWishlist(product)}
              className="w-full md:w-auto"
            >
              Voeg toe aan wishlist
            </Button>
          )}
          {handleDeleteItem && product.isIncluded && (
            <Button
              variant="destructive"
              onClick={() => handleDeleteItem(product.id)}
              className="w-full md:w-auto"
            >
              Verwijder uit wishlist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}