/**
 * ✅ GOLD STANDARD: Gebruikt directe createWishlistAction
 */
'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '../ui/loading-spinner';
import WishlistSelector from '../wishlist/WishlistSelector';
import { createWishlistAction } from '@/lib/server/actions/wishlist-actions'; // ✅ Direct import
import { useSession } from '@/components/providers/auth-provider';

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
  const [isPending, startTransition] = useTransition();
  const { user } = useSession();

  const handleCreateNewWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Je moet ingelogd zijn');
      return;
    }

    if (!newWishlistName.trim()) {
      toast.error('Geef je wishlist een naam');
      return;
    }

    startTransition(async () => {
      // ✅ Gebruik de directe versie met userId parameter
      const result = await createWishlistAction(user.id, {
        name: newWishlistName,
        isPublic: false,
      });

      if (result.success && result.data) {
        onWishlistSelect(result.data);
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
    <WishlistSelector
      selectedWishlistId={selectedWishlistId}
      onWishlistSelect={onWishlistSelect}
      onCreateNew={() => setShowNewWishlistForm(true)}
    />
  );
}