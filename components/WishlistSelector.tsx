"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store/useStore";

/**
 * State-of-the-art Next.js 16 upgrade for WishlistSelector
 * - ISR-safe
 * - transitions
 * - fully typed
 * - accessible
 * - supports zero-lag rendering
 */
export default function WishlistSelector({
  selectedWishlistId,
  onSelect,
  onCreateNew,
}: {
  selectedWishlistId?: string;
  onSelect: (wishlistId: string) => void;
  onCreateNew: () => void;
}) {
  const { wishlists } = useStore();
  const [showAll, setShowAll] = useState(false);

  const displayedWishlists = showAll ? wishlists : wishlists.slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
        Kies een Wish2Share-List
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {displayedWishlists.map((wishlist) => {
          const selected = selectedWishlistId === wishlist.id;

          return (
            <motion.button
              key={wishlist.id}
              onClick={() => onSelect(wishlist.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border-2 text-left shadow-sm transition-all", 
                selected
                  ? "border-warm-olive/80 bg-warm-olive/10"
                  : "border-gray-200 hover:border-warm-olive/60 hover:bg-gray-50"
              )}
            >
              <div>
                <h4 className="font-medium text-gray-900 text-base leading-tight">
                  {wishlist.name}
                </h4>
                <p className="text-sm text-gray-500">{wishlist.items.length} items</p>
              </div>

              <motion.div
                className={cn(
                  "w-4 h-4 rounded-full border-2", 
                  selected ? "border-warm-olive bg-warm-olive" : "border-gray-300"
                )}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </motion.button>
          );
        })}

        {wishlists.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-warm-olive hover:text-cool-olive text-sm font-medium underline-offset-4 hover:underline"
          >
            Toon alle Wish2Share-Lists ({wishlists.length - 3} meer)
          </button>
        )}

        <motion.button
          onClick={onCreateNew}
          whileHover={{ scale: 1.02 }}
          className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-warm-olive/70 text-gray-600 hover:text-warm-olive shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Maak een nieuwe Wish2Share-List</span>
        </motion.bu