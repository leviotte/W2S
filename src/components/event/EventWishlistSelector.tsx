// app/components/EventWishlistSelector.tsx
"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import WishlistSelector from "../wishlist/WishlistSelector";
import { toast } from "sonner";

interface EventWishlistSelectorProps {
  onWishlistSelect: (wishlistId: string) => void;
  selectedWishlistId?: string;
}

const EventWishlistSelector: React.FC<EventWishlistSelectorProps> = ({
  onWishlistSelect,
  selectedWishlistId,
}) => {
  const [showNewWishlistForm, setShowNewWishlistForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const { createWishlist } = useStore();

  const handleCreateNewWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishlistName.trim()) {
      toast.error("Give your wishlist a name");
      return;
    }

    try {
      const wishlistId = await createWishlist({
        name: newWishlistName,
        items: [],
        isPrivate: false,
      });
      onWishlistSelect(wishlistId);
      setShowNewWishlistForm(false);
      setNewWishlistName("");
      toast.success("Wishlist created!");
    } catch (error) {
      toast.error("Something went wrong while creating the wishlist");
    }
  };

  return (
    <div className="space-y-6">
      {showNewWishlistForm ? (
        <form onSubmit={handleCreateNewWishlist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name of the new wishlist
            </label>
            <input
              type="text"
              value={newWishlistName}
              onChange={(e) => setNewWishlistName(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              placeholder="For example: Birthday 2024"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowNewWishlistForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive"
            >
              Create Wishlist
            </button>
          </div>
        </form>
      ) : (
        <WishlistSelector
          selectedWishlistId={selectedWishlistId}
          onSelect={onWishlistSelect}
          onCreateNew={() => setShowNewWishlistForm(true)}
        />
      )}
    </div>
  );
};

export default EventWishlistSelector;
