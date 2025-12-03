"use client";

import { useState, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/client/firebase";

interface Platform {
  URL: string;
  Price: number;
  Source: string;
}

interface Product {
  ID?: string;
  id?: string;
  Title: string;
  Description?: string;
  ImageURL?: string;
  ean?: string;
  URL?: string;
  Price?: number;
  Source?: string;
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    product.platforms ? Object.keys(product.platforms)[0] : null
  );

  const toggleDescription = () => setShowFullDescription((prev) => !prev);

  const platforms = product.platforms ? Object.keys(product.platforms) : [];
  const hasMultiplePlatforms = platforms.length > 1;

  const currentPlatform = useMemo(() => {
    if (product.platforms && selectedPlatform) return product.platforms[selectedPlatform];
    return {
      URL: product.URL || "#",
      Price: product.Price || 0,
      Source: product.Source || "unknown",
    };
  }, [product, selectedPlatform]);

  const getShopImage = useCallback((source: string | null) => {
    if (!source) return "/bol.png";
    return source === "amz"
      ? "https://amazon-blogs-brightspot-lower.s3.amazonaws.com/about/00/92/0260aab44ee8a2faeafde18ee1da/amazon-logo-inverse.svg"
      : "/bol.png";
  }, []);

  const trackProductClick = useCallback(
    async (platformName: string | null) => {
      try {
        await addDoc(collection(db, "clicks"), {
          productId: product.ID || product.id,
          source: platformName?.toUpperCase() || "UNKNOWN",
          title: product.Title,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error tracking click:", error);
      }
    },
    [product]
  );

  const CHARACTER_LIMIT = 150;
  const descriptionText = product.Description || "";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 cursor-auto bg-black/10 flex items-center justify-center z-50"
    >
      <div className="bg-white relative rounded-lg shadow-xl flex flex-col md:flex-row w-full lg:max-w-4xl max-w-[90%] lg:min-h-[550px] md:min-h-[470px] md:max-h-fit max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            setActiveProduct(null);
            setModal(false);
          }}
          className="absolute top-1.5 right-1.5 z-[10] text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product Image */}
        <div className="md:p-8 px-8 py-14 md:w-[55%] rounded-tl-lg rounded-tr-lg md:rounded-tr-none md:rounded-bl-lg flex items-center justify-center">
          <img src={product.ImageURL} alt={product.Title} className="scale-[1.2]" />
        </div>

        {/* Product Details */}
        <div className="pl-6 md:py-6 pb-6 pt-[32px] pr-10 md:w-[45%] md:max-h-[550px] md:overflow-y-auto relative bg-[#f5f5f5] rounded-tr-lg rounded-br-lg">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-800 mb-1">{product.Title}</h1>
            {product.ean && <p className="text-xs text-gray-500">EAN: {product.ean}</p>}
          </div>

          {/* Platforms */}
          {hasMultiplePlatforms && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Available at:</p>
              <div className="flex space-x-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`px-3 py-1 rounded-md text-sm ${
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

          {/* Price */}
          <a
            href={currentPlatform.URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackProductClick(selectedPlatform)}
            className="cursor-pointer hover:bg-white/50 transition-all ease-in-out duration-300 flex group items-center justify-between mb-4 px-4 py-2 bg-white rounded-[10px]"
          >
            <div className="flex items-center">
              <img src={getShopImage(selectedPlatform)} alt={`${selectedPlatform} logo`} className={`${selectedPlatform === "amz" ? "h-5 mt-[5px] w-16" : "h-6 w-10"}`} />
            </div>
            <p className="text-lg font-bold text-[#606c38]">
              <span className="group-hover:underline">€{currentPlatform.Price}</span>
              <span> *</span>
            </p>
          </a>

          {/* Price Comparison */}
          {hasMultiplePlatforms && (
            <div className="mb-4 p-3 bg-white/50 rounded-md">
              <p className="text-sm font-medium mb-1">Price Comparison:</p>
              {platforms.map((platform) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-sm">{platform.toUpperCase()}</span>
                  <span className="text-sm font-medium">€{product.platforms![platform].Price}</span>
                </div>
              ))}
              {platforms.length > 1 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-[#606c38]">
                    Save up to €
                    {Math.abs(
                      product.platforms![platforms[0]].Price - product.platforms![platforms[1]].Price
                    ).toFixed(2)}{" "}
                    by comparing!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6 text-gray-700">
            {descriptionText && (
              <>
                {!showFullDescription && descriptionText.replace(/<[^>]+>/g, "").length > CHARACTER_LIMIT ? (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descriptionText.replace(/(<([^>]+)>)/gi, "").substring(0, CHARACTER_LIMIT) + "...") }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(descriptionText) }} />
                )}
                {descriptionText.replace(/<[^>]+>/g, "").length > CHARACTER_LIMIT && (
                  <span onClick={toggleDescription} className="text-[#606c38] font-medium cursor-pointer block mt-2">
                    {showFullDescription ? "show less" : "read more"}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Disclaimer */}
          <div className="text-sm text-gray-500 mb-4">
            <p>
              Prices, shipping fees, and product availability may change without notice. The details shown on the web shop at the time of purchase will be the ones that apply to your order.
            </p>
          </div>
        </div>

        {/* Wishlist Button */}
        <div className="flex absolute md:top-[420px] top-[290px] md:ml-[60px] inset-x-0 mx-auto justify-center">
          <button
            onClick={() => {
              if (product.isIncluded) {
                handleDeleteItem?.(product.ID || product.id);
                removeItemFromList?.(product);
              } else {
                addItemToWishlist?.(product);
              }
            }}
            className="rounded-full bg-white border border-gray-300 shadow-md px-6 py-2 flex items-center text-green-700 hover:bg-gray-50"
          >
            <span className="mr-2">
              {product.isIncluded ? "Remove from wish list" : "Add to wish list"}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={product.isIncluded ? "#606c38" : "#dedede"} viewBox="0 0 24 24" stroke="transparent">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
