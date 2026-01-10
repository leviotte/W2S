// src/app/wishlist/_components/WishlistSelector.client.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Wishlist } from "@/types/wishlist";

interface Props {
  wishlists: Wishlist[];
  selectedWishlistId?: string;
  onSelect: (wishlistId: string) => void;
  onCreateNew: () => void;
}

export function WishlistSelectorClient({
  wishlists,
  selectedWishlistId,
  onSelect,
  onCreateNew,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayedWishlists = showAll ? wishlists : wishlists.slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">
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
                "flex items-center justify-between rounded-xl border-2 p-4 text-left shadow-sm transition-all",
                selected
                  ? "border-warm-olive/80 bg-warm-olive/10"
                  : "border-gray-200 hover:border-warm-olive/60 hover:bg-gray-50"
              )}
            >
              <div>
                <h4 className="font-medium leading-tight">
                  {wishlist.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {wishlist.items.length} items
                </p>
              </div>

              <div
                className={cn(
                  "h-4 w-4 rounded-full border-2",
                  selected
                    ? "border-warm-olive bg-warm-olive"
                    : "border-gray-300"
                )}
              />
            </motion.button>
          );
        })}

        {wishlists.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-warm-olive hover:text-cool-olive hover:underline"
          >
            Toon alle Wish2Share-Lists ({wishlists.length - 3} meer)
          </button>
        )}

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 text-sm font-medium text-warm-olive hover:text-cool-olive"
        >
          <Plus className="h-4 w-4" />
          Nieuwe lijst maken
        </button>
      </div>
    </div>
  );
}
