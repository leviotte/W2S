// src/app/event/_components/EventWishlistSelector.client.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistSelectorClient } from '@/app/wishlist/_components/WishlistSelector.client';
import { createWishlistAction } from '@/lib/server/actions/wishlist';
import type { Wishlist } from '@/types/wishlist';

interface Props {
  wishlists: Wishlist[];
  userId: string;
  selectedWishlistId?: string;
  onSelectServerAction: (wishlistId: string) => void;
}

export function EventWishlistSelectorClient({
  wishlists,
  userId,
  selectedWishlistId,
  onSelectServerAction,
}: Props) {
  const [showNewWishlistForm, setShowNewWishlistForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateNewWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWishlistName.trim()) {
      toast.error('Geef je wishlist een naam');
      return;
    }

    startTransition(async () => {
      const result = await createWishlistAction({
        userId,
        data: { name: newWishlistName.trim(), isPublic: false },
      });

      if (result.success && result.data) {
        onSelectServerAction(result.data.id);
        setShowNewWishlistForm(false);
        setNewWishlistName('');
        toast.success('Wishlist aangemaakt!');
      } else {
        toast.error(result.error || 'Kon wishlist niet aanmaken');
      }
    });
  };

  if (showNewWishlistForm) {
    return (
      <form onSubmit={handleCreateNewWishlist} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wishlist-name">Naam van de nieuwe wishlist</Label>
          <Input
            id="wishlist-name"
            type="text"
            value={newWishlistName}
            onChange={(e) => setNewWishlistName(e.target.value)}
            placeholder="Bijvoorbeeld: Verjaardag 2025"
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowNewWishlistForm(false)}
            disabled={isPending}
          >
            Annuleren
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <LoadingSpinner size="sm" className="mr-2" />}
            Wishlist Aanmaken
          </Button>
        </div>
      </form>
    );
  }

  return (
    <WishlistSelectorClient
      wishlists={wishlists}
      selectedWishlistId={selectedWishlistId}
      onSelect={onSelectServerAction}
      onCreateNew={() => setShowNewWishlistForm(true)}
    />
  );
}
