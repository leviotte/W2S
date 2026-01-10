// src/app/_components/WishlistLinkModal.client.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { linkWishlistToEventAction, createWishlistAction } from '@/lib/server/actions/wishlist';
import type { Wishlist } from '@/types/wishlist';

interface WishlistLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  wishlists: Wishlist[];
  userId: string; // van je server/session
  participantId: string; // wie gekoppeld moet worden
}

export function WishlistLinkModalClient({
  open,
  onOpenChange,
  eventId,
  eventName,
  wishlists,
  userId,
  participantId,
}: WishlistLinkModalProps) {
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>();
  const [newWishlistName, setNewWishlistName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectExisting = (wishlistId: string) => {
    setSelectedWishlistId(wishlistId);
    setNewWishlistName('');
    setShowNewForm(false);
  };

  const handleSubmit = () => {
    if (!selectedWishlistId && !newWishlistName.trim()) {
      toast.error('Selecteer een bestaande wishlist of geef een naam op voor een nieuwe');
      return;
    }

    startTransition(async () => {
      try {
        if (selectedWishlistId) {
          // Koppel bestaande wishlist
          const result = await linkWishlistToEventAction({
            eventId,
            wishlistId: selectedWishlistId,
            participantId,
          });

          if (result.success) {
            const linkedWishlist = wishlists.find(w => w.id === selectedWishlistId);
            const name = linkedWishlist?.name || '';
            toast.success(`"${name}" gekoppeld aan ${eventName}!`);
            onOpenChange(false);
            setSelectedWishlistId(undefined);
          }
        } else if (newWishlistName.trim()) {
          // Maak nieuwe wishlist aan
          const result = await createWishlistAction({
            userId,
            data: {
              name: newWishlistName.trim(),
              eventId,
              participantId,
            },
          });

          if (result.success) {
            toast.success(`"${newWishlistName}" aangemaakt en gekoppeld aan ${eventName}!`);
            onOpenChange(false);
            setNewWishlistName('');
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Er ging iets mis bij het koppelen');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Wishlist koppelen</DialogTitle>
          <DialogDescription>
            Voor event <strong>{eventName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showNewForm && wishlists.length > 0 && (
            <>
              <Label>Bestaande wishlist selecteren</Label>
              <Select value={selectedWishlistId} onValueChange={handleSelectExisting} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer bestaande wishlist..." />
                </SelectTrigger>
                <SelectContent>
                  {wishlists.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.items.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="link"
                onClick={() => setShowNewForm(true)}
                className="text-sm mt-1"
              >
                Nieuwe wishlist maken
              </Button>
            </>
          )}

          {showNewForm && (
            <div className="space-y-2">
              <Label htmlFor="new-wishlist">Nieuwe wishlist naam</Label>
              <Input
                id="new-wishlist"
                placeholder="Bijv. Verjaardag 2026"
                value={newWishlistName}
                onChange={(e) => {
                  setNewWishlistName(e.target.value);
                  setSelectedWishlistId(undefined);
                }}
                disabled={isPending}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                  disabled={isPending}
                >
                  Annuleren
                </Button>
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                  Maak & Koppel
                </Button>
              </div>
            </div>
          )}

          {!showNewForm && selectedWishlistId && (
            <Button className="w-full mt-2" onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Koppel wishlist
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
