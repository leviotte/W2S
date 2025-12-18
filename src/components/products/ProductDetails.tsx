// src/components/products/ProductDetails.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { X, Heart } from "lucide-react";
import { Button } from '@/components/ui/button';
import type { Product, ProductWithInclusion, PlatformSpecificData } from '@/types/product';

interface ProductDetailsProps {
  product: ProductWithInclusion;
  setModal: (val: boolean) => void;
  setActiveProduct: (product: ProductWithInclusion | null) => void;
  addItemToWishlist?: (product: Product) => void;
  handleDeleteItem?: (id: string | number) => void;
}

const CHARACTER_LIMIT = 150;

export default function ProductDetails({
  product,
  setModal,
  setActiveProduct,
  addItemToWishlist,
  handleDeleteItem,
}: ProductDetailsProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    product.platforms ? Object.keys(product.platforms)[0] : null
  );

  const title = product.title;
  const imageUrl = product.imageUrl;
  const description = product.description || "";

  const platforms = product.platforms ? Object.keys(product.platforms) : [];
  const hasMultiplePlatforms = platforms.length > 1;

  const currentPlatform = useMemo(() => {
    if (product.platforms && selectedPlatform) {
      return product.platforms[selectedPlatform];
    }
    return {
      URL: product.url || "#",
      Price: product.price || 0,
      Source: product.source || "unknown",
    };
  }, [product, selectedPlatform]);

  const toggleDescription = () => setShowFullDescription((prev) => !prev);

  const onDeleteClick = useCallback(() => {
    if (handleDeleteItem) {
      handleDeleteItem(product.id);
    }
  }, [product.id, handleDeleteItem]);

  const onAddClick = useCallback(() => {
    if (addItemToWishlist) {
      // ✅ Stuur alleen de base Product properties (zonder isIncluded)
      const { isIncluded, ...baseProduct } = product;
      addItemToWishlist(baseProduct as Product);
    }
  }, [product, addItemToWishlist]);

  const getShopImage = useCallback((source: string | null) => {
    if (!source) return "/logos/bol.png";
    return source.toLowerCase() === "amz"
      ? "https://amazon-blogs-brightspot-lower.s3.amazonaws.com/about/00/92/0260aab44ee8a2faeafde18ee1da/amazon-logo-inverse.svg"
      : "/logos/bol.png";
  }, []);

  const trackProductClick = useCallback(
    async (platformName: string | null) => {
      try {
        await addDoc(collection(db, "clicks"), {
          productId: product.id,
          source: platformName?.toUpperCase() || "UNKNOWN",
          title: product.title,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    },
    [product]
  );

  const handleClose = () => {
    setActiveProduct(null);
    setModal(false);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white relative rounded-lg shadow-xl flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Sluit productdetails"
        >
          <X size={28} />
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 p-8 flex items-center justify-center bg-gray-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[400px] object-contain"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p>Geen afbeelding beschikbaar</p>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

          {product.ean && (
            <p className="text-xs text-gray-500 mb-4">EAN: {product.ean}</p>
          )}

          {/* Platform Selection */}
          {hasMultiplePlatforms && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-gray-600">
                Verkrijgbaar bij:
              </p>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      selectedPlatform === platform
                        ? "bg-[#606c38] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {platform.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Link */}
          <a
            href={currentPlatform.URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackProductClick(selectedPlatform)}
            className="block my-4 p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-400 transition"
          >
            <div className="flex justify-between items-center">
              <img
                src={getShopImage(selectedPlatform)}
                alt={`${selectedPlatform} logo`}
                className={`h-6 ${
                  selectedPlatform === "amz" ? "w-16" : "w-10"
                }`}
              />
              <span className="text-xl font-bold text-[#606c38]">
                €{currentPlatform.Price?.toFixed(2)} *
              </span>
            </div>
          </a>

          {/* Price Comparison */}
          {hasMultiplePlatforms && product.platforms && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-2 text-gray-600">
                Prijsvergelijking:
              </p>
              <div className="space-y-1">
                {platforms.map((platform) => (
                  <div key={platform} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{platform.toUpperCase()}</span>
                    <span className="font-medium">
                      €{product.platforms![platform].Price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {platforms.length > 1 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-[#606c38] font-medium">
                    Bespaar tot €
                    {Math.abs(
                      Math.max(...platforms.map(p => product.platforms![p].Price)) -
                      Math.min(...platforms.map(p => product.platforms![p].Price))
                    ).toFixed(2)} door te vergelijken!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="prose prose-sm max-w-none text-gray-600 mb-4">
              {description.length > CHARACTER_LIMIT && !showFullDescription ? (
                <>
                  <p>{description.substring(0, CHARACTER_LIMIT)}...</p>
                  <button
                    onClick={toggleDescription}
                    className="text-[#606c38] font-semibold text-sm hover:underline mt-2"
                  >
                    Lees meer
                  </button>
                </>
              ) : (
                <>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(description),
                    }}
                  />
                  {description.length > CHARACTER_LIMIT && (
                    <button
                      onClick={toggleDescription}
                      className="text-[#606c38] font-semibold text-sm hover:underline mt-2"
                    >
                      Toon minder
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-4">
            <Button
              onClick={() => {
                if (product.isIncluded) {
                  onDeleteClick();
                } else {
                  onAddClick();
                }
              }}
              className={`w-full ${
                product.isIncluded 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-[#606c38] hover:bg-[#4a5526]"
              }`}
            >
              <Heart 
                className={`mr-2 h-5 w-5 ${product.isIncluded ? "fill-current" : ""}`} 
              />
              {product.isIncluded
                ? "Verwijder van wenslijst"
                : "Voeg toe aan wenslijst"}
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              * Prijzen en beschikbaarheid kunnen wijzigen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}