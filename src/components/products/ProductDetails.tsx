"use client";

import { useState, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { X } from "lucide-react";
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface Platform {
  URL: string;
  Price: number;
  Source: string;
}

interface Product {
  id?: string;
  ID?: string; // Backward compatibility
  title: string;
  description?: string;
  imageUrl?: string;
  ImageURL?: string; // Backward compatibility
  ean?: string;
  url?: string;
  URL?: string; // Backward compatibility
  price?: number;
  Price?: number; // Backward compatibility
  source?: string;
  Source?: string; // Backward compatibility
  platforms?: Record<string, Platform>;
  isIncluded?: boolean;
}

interface ProductDetailCardProps {
  product: Product;
  setModal: (val: boolean) => void;
  setActiveProduct: (product: Product | null) => void;
  removeItemFromList?: (product: Product) => void;
  addItemToWishlist?: (product: Product) => void;
  handleDeleteItem?: (id: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHARACTER_LIMIT = 150;

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProductDetailCard({
  product,
  setModal,
  setActiveProduct,
  removeItemFromList,
  addItemToWishlist,
  handleDeleteItem,
}: ProductDetailCardProps) {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    product.platforms ? Object.keys(product.platforms)[0] : null
  );

  // ============================================================================
  // NORMALIZED DATA ACCESS
  // ============================================================================
  
  const title = product.title;
  const imageUrl = product.imageUrl || product.ImageURL;
  const description = product.description || "";
  const price = product.price ?? product.Price;
  const url = product.url || product.URL;
  const source = product.source || product.Source;

  // ============================================================================
  // PLATFORM DATA
  // ============================================================================
  
  const platforms = product.platforms ? Object.keys(product.platforms) : [];
  const hasMultiplePlatforms = platforms.length > 1;

  const currentPlatform = useMemo(() => {
    if (product.platforms && selectedPlatform) {
      return product.platforms[selectedPlatform];
    }
    return {
      URL: url || "#",
      Price: price || 0,
      Source: source || "unknown",
    };
  }, [product, selectedPlatform, url, price, source]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const toggleDescription = () => setShowFullDescription((prev) => !prev);

  const onDeleteClick = useCallback(() => {
    const idToDelete = product.id || product.ID;
    if (idToDelete && handleDeleteItem) {
      handleDeleteItem(idToDelete);
    }
    if (removeItemFromList) {
      removeItemFromList(product);
    }
  }, [product, handleDeleteItem, removeItemFromList]);

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
          productId: product.id || product.ID,
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

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div
      onClick={() => setModal(false)}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white relative rounded-lg shadow-xl flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={() => setModal(false)}
          className="absolute top-2 right-2 z-20 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Sluit productdetails"
        >
          <X size={28} />
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 p-8 flex items-center justify-center bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p>Geen afbeelding beschikbaar</p>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

          {/* EAN */}
          {product.ean && (
            <p className="text-xs text-gray-500 mb-4">EAN: {product.ean}</p>
          )}

          {/* Platform Selector */}
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

          {/* Price Card */}
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

          {/* Description */}
          {description && (
            <div className="prose prose-sm max-w-none text-gray-600 mb-4">
              {description.length > CHARACTER_LIMIT && !showFullDescription ? (
                <>
                  <p>{description.substring(0, CHARACTER_LIMIT)}...</p>
                  <button
                    onClick={toggleDescription}
                    className="text-blue-600 font-semibold text-sm hover:underline"
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
                      className="text-blue-600 font-semibold text-sm hover:underline"
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
                  addItemToWishlist?.(product);
                }
              }}
              variant={product.isIncluded ? "destructive" : "default"}
              className="w-full"
            >
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