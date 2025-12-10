"use client";

import { useState, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { X } from "lucide-react"; // Gebruik Lucide voor consistentie

interface Platform {
  URL: string;
  Price: number;
  Source: string;
}

// Consistentere naming (kleine letters)
interface Product {
  id?: string; // Voorkeur voor 'id'
  ID?: string; // Behoud voor compatibiliteit
  title: string;
  description?: string;
  imageUrl?: string;
  ImageURL?: string; // Behoud voor compatibiliteit
  ean?: string;
  url?: string;
  URL?: string; // Behoud voor compatibiliteit
  price?: number;
  Price?: number; // Behoud voor compatibiliteit
  source?: string;
  Source?: string; // Behoud voor compatibiliteit
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

export default function ProductDetailCard({
  product,
  setModal,
  setActiveProduct,
  removeItemFromList,
  addItemToWishlist,
  handleDeleteItem,
}: ProductDetailCardProps) {
  // ... (je bestaande state en hooks blijven hier)
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    product.platforms ? Object.keys(product.platforms)[0] : null
  );

  const toggleDescription = () => setShowFullDescription((prev) => !prev);
  
  // VERBETERING: Normaliseer data toegang
  const title = product.title;
  const imageUrl = product.imageUrl || product.ImageURL;
  const description = product.description || "";
  const price = product.price ?? product.Price;
  const url = product.url || product.URL;
  const source = product.source || product.Source;


  // VERBETERING: De code voor de 'handle delete' actie is nu type-safe
  const onDeleteClick = () => {
    const idToDelete = product.id || product.ID;
    if (idToDelete && handleDeleteItem) {
        handleDeleteItem(idToDelete);
    }
    if (removeItemFromList) {
        removeItemFromList(product);
    }
  };

  // ... rest van je component logica...
  const platforms = product.platforms ? Object.keys(product.platforms) : [];
  const hasMultiplePlatforms = platforms.length > 1;

  const currentPlatform = useMemo(() => {
    if (product.platforms && selectedPlatform) return product.platforms[selectedPlatform];
    return {
      URL: url || "#",
      Price: price || 0,
      Source: source || "unknown",
    };
  }, [product, selectedPlatform, url, price, source]);

  const getShopImage = useCallback((source: string | null) => {
    if (!source) return "/logos/bol.png"; // Correct pad
    return source.toLowerCase() === "amz"
      ? "https://amazon-blogs-brightspot-lower.s3.amazonaws.com/about/00/92/0260aab44ee8a2faeafde18ee1da/amazon-logo-inverse.svg"
      : "/logos/bol.png";
  }, []);

  const trackProductClick = useCallback( async (platformName: string | null) => {
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
  
  const CHARACTER_LIMIT = 150;
  
  return (
    <div
      onClick={() => setModal(false)}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-white relative rounded-lg shadow-xl flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        <button onClick={() => setModal(false)} className="absolute top-2 right-2 z-20 text-gray-400 hover:text-gray-600">
          <X size={28} />
        </button>

        <div className="md:w-1/2 p-8 flex items-center justify-center bg-gray-100">
          {imageUrl && <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />}
        </div>

        <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
           {/* Je bestaande JSX voor de product details. Hieronder een licht opgeschoonde versie als voorbeeld */}
           <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
           {product.ean && <p className="text-xs text-gray-500 mb-4">EAN: {product.ean}</p>}

           {hasMultiplePlatforms && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-gray-600">Verkrijgbaar bij:</p>
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
          
          <a href={currentPlatform.URL} target="_blank" rel="noopener noreferrer" onClick={() => trackProductClick(selectedPlatform)} className="block my-4 p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-400 transition">
            <div className="flex justify-between items-center">
                <img src={getShopImage(selectedPlatform)} alt={`${selectedPlatform} logo`} className={`h-6 ${selectedPlatform === "amz" ? "w-16" : "w-10"}`} />
                <span className="text-xl font-bold text-[#606c38]">€{currentPlatform.Price?.toFixed(2)} *</span>
            </div>
          </a>

          {description && (
            <div className="prose prose-sm max-w-none text-gray-600 mb-4">
              {description.length > CHARACTER_LIMIT && !showFullDescription ? (
                  <>
                    <p>{description.substring(0, CHARACTER_LIMIT)}...</p>
                    <button onClick={toggleDescription} className="text-blue-600 font-semibold text-sm">Lees meer</button>
                  </>
              ) : (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
                    {description.length > CHARACTER_LIMIT && (
                      <button onClick={toggleDescription} className="text-blue-600 font-semibold text-sm">Toon minder</button>
                    )}
                  </>
              )}
            </div>
          )}

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
                {product.isIncluded ? "Verwijder van wenslijst" : "Voeg toe aan wenslijst"}
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">* Prijzen en beschikbaarheid kunnen wijzigen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}