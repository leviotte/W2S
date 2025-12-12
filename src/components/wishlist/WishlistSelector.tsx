"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/use-auth-store";
import type { Wishlist } from "@/types/wishlist";

export default function WishlistSelector({
  selectedWishlistId,
  onSelect,
  onCreateNew,
}: {
  selectedWishlistId?: string;
  onSelect: (wishlistId: string) => void;
  onCreateNew: () => void;
}) {
  const wishlists = useAuthStore((state) => state.wishlists);
  const [showAll, setShowAll] = useState(false);

  const displayedWishlists = showAll ? wishlists : wishlists.slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
        Kies een Wish2Share-List
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {displayedWishlists.map((wishlist: Wishlist) => {
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
                <p className="text-sm text-gray-500">
                  {wishlist.items?.length || 0} items
                </p>
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

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 text-warm-olive hover:text-cool-olive text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nieuwe lijst maken
        </button>
      </div>
    </div>
  );
}