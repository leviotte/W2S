// src/app/event/_components/EventWishlistLinkModal.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistSelectorClient } from '@/app/wishlist/_components/WishlistSelector.client';
import { createWishlistAction, linkWishlistToEventAction } from '@/lib/server/actions/wishlist';
import type { Wishlist } from '@/types/wishlist';

interface Props {
  wishlists: Wishlist[];
  userId: string;
  selectedWishlistId?: string;
  eventId: string;
  participantId?: string; // optioneel
  onSuccess: (wishlistId: string) => void;
}

export function EventWishlistLinkModalClient({
  wishlists,
  userId,
  selectedWishlistId,
  eventId,
  participantId,
  onSuccess,
}: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateOrLink = async (wishlistId?: string) => {
    startTransition(async () => {
      try {
        if (wishlistId) {
          // Bestaande wishlist koppelen
          const result = await linkWishlistToEventAction({
            eventId,
            wishlistId,
            participantId: participantId || '', // fallback
          });

          if (result.success) {
            const linkedWishlist = wishlists.find(w => w.id === wishlistId);
            const name = linkedWishlist?.name || '';
            toast.success(`"${name}" gekoppeld aan event!`);
            onSuccess(wishlistId);
          } else {
            toast.error('Kon wishlist niet koppelen');
          }
        } else if (newName.trim()) {
          // Nieuwe wishlist aanmaken
          const createResult = await createWishlistAction({
            userId,
            data: {
              name: newName.trim(),
              eventId,
              participantId: participantId || '',
            },
          });

          if (createResult.success && createResult.data) {
            const newWishlistId = createResult.data.id; // ✅ correct
            if (participantId) {
              await linkWishlistToEventAction({
                eventId,
                wishlistId: newWishlistId,
                participantId,
              });
            }

            toast.success(`"${newName}" aangemaakt en gekoppeld!`);
            onSuccess(newWishlistId);
            setNewName('');
            setShowNewForm(false);
          } else {
            toast.error('Kon wishlist niet aanmaken');
          }
        } else {
          toast.error('Voer een naam in voor de nieuwe wishlist of selecteer een bestaande');
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Er ging iets mis bij het koppelen van wishlist');
      }
    });
  };

  if (showNewForm) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateOrLink();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="wishlist-name">Naam van nieuwe wishlist</Label>
          <Input
            id="wishlist-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Bijv: Verjaardag 2026"
            disabled={isPending}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowNewForm(false)}
            disabled={isPending}
          >
            Annuleren
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <LoadingSpinner size="sm" className="mr-2" />}
            Aanmaken & Koppelen
          </Button>
        </div>
      </form>
    );
  }

  return (
    <WishlistSelectorClient
      wishlists={wishlists}
      selectedWishlistId={selectedWishlistId}
      onSelect={(id) => handleCreateOrLink(id)}
      onCreateNew={() => setShowNewForm(true)}
    />
  );
}
