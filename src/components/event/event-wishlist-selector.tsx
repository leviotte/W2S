/**
 * src/features/events/components/event-wishlist-selector.tsx
 *
 * FINALE VERSIE: Met correcte JSX-syntax (onSubmit, onChange, etc.)
 */
'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/store/use-auth-store';
import WishlistSelector from '../wishlist/WishlistSelector';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Gebruik van alias-paden is robuuster!
import { LoadingSpinner } from '../ui/loading-spinner';

interface EventWishlistSelectorProps {
  onWishlistSelect: (wishlistId: string) => void;
  selectedWishlistId?: string;
}

export function EventWishlistSelector({
  onWishlistSelect,
  selectedWishlistId,
}: EventWishlistSelectorProps) {
  const [showNewWishlistForm, setShowNewWishlistForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  
  const { createWishlist, loading } = useAuthStore((state) => ({
    createWishlist: state.createWishlist,
    loading: state.loading,
  }));

  const handleCreateNewWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishlistName.trim()) {
      toast.error('Geef je wishlist een naam');
      return;
    }

    const newWishlistId = await createWishlist({
      name: newWishlistName,
      items: [],
      isPrivate: false,
    });

    if (newWishlistId) {
      onWishlistSelect(newWishlistId);
      setShowNewWishlistForm(false);
      setNewWishlistName('');
    }
  };

  if (showNewWishlistForm) {
    return (
      // CORRECT: onSubmit={...}
      <form onSubmit={handleCreateNewWishlist} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wishlist-name">Naam van de nieuwe wishlist</Label>
          <Input
            id="wishlist-name"
            type="text"
            value={newWishlistName}
            // CORRECT: onChange={...}
            onChange={(e) => setNewWishlistName(e.target.value)}
            placeholder="Bijvoorbeeld: Verjaardag 2025"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            // CORRECT: onClick={...}
            onClick={() => setShowNewWishlistForm(false)}
            disabled={loading}
          >
            Annuleren
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Wishlist Aanmaken
          </Button>
        </div>
      </form>
    );
  }

  return (
    <WishlistSelector
      selectedWishlistId={selectedWishlistId}
      // CORRECT: prop namen zijn essentieel!
      onSelect={onWishlistSelect} 
      onCreateNew={() => setShowNewWishlistForm(true)}
    />
  );
}