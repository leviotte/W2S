// src/app/wishlist/_components/WishlistLinkModal.tsx
"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Plus, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/lib/store/use-auth-store";
import {
  createWishlistAction,
  linkWishlistToEventAction,
  getWishlistsByOwnerId,
} from "@/lib/server/actions/wishlist";
import type { Wishlist } from "@/types/wishlist";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface WishlistLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  participantId?: string;
}

export function WishlistLinkModal({
  open,
  onOpenChange,
  eventId,
  eventName,
  participantId,
}: WishlistLinkModalProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [isPending, startTransition] = useTransition();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load wishlists when modal opens
  useEffect(() => {
    if (open && currentUser) {
      loadWishlists();
    } else if (!open) {
      setSelectedWishlistId("");
      setNewWishlistName("");
    }
  }, [open, currentUser]);

  // ✅ Load wishlists callback
  const loadWishlists = useCallback(async () => {
    if (!currentUser) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getWishlistsByOwnerId(currentUser.id);

      if (result.success) {
        if (result.data) setWishlists(result.data);
        if (result.data?.length === 1) setSelectedWishlistId(result.data[0].id);
      } else {
        // Type narrowing: TS weet hier dat error bestaat
        if ('error' in result) {
  toast.error(result.error ?? "Kon wishlists niet laden");
} else {
  toast.error("Kon wishlists niet laden");
}
        setWishlists([]);
      }
    } catch (error) {
      console.error("Load wishlists error:", error);
      toast.error("Er ging iets mis bij het laden");
      setWishlists([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // ✅ Link existing wishlist
  const handleLinkExisting = useCallback(async () => {
    if (!selectedWishlistId) {
      toast.error("Selecteer een wishlist");
      return;
    }

    if (!currentUser) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    const selectedWishlist = wishlists.find(w => w.id === selectedWishlistId);

    startTransition(async () => {
      try {
        const result = await linkWishlistToEventAction({
          eventId,
          wishlistId: selectedWishlistId,
          participantId: participantId || currentUser.id,
        });

        if (result.success) {
          toast.success(`"${selectedWishlist?.name}" gekoppeld aan ${eventName}!`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(result.error ?? "Koppelen mislukt");
        }
      } catch (error) {
        console.error("Link wishlist error:", error);
        toast.error("Er ging iets mis bij het koppelen");
      }
    });
  }, [selectedWishlistId, currentUser, eventId, participantId, eventName, wishlists, onOpenChange, router]);

  // ✅ Create new wishlist
  const handleCreateNew = useCallback(async () => {
    if (!newWishlistName.trim()) {
      toast.error("Geef de wishlist een naam");
      return;
    }

    if (!currentUser) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createWishlistAction({
          userId: currentUser.id,
          data: {
            name: newWishlistName.trim(),
            description: `Wishlist voor ${eventName}`,
            isPublic: false,
          },
        });

        if (result.success && result.data) {
          const linkResult = await linkWishlistToEventAction({
            eventId,
            wishlistId: result.data.id,
            participantId: participantId || currentUser.id,
          });

          if (linkResult.success) {
            toast.success("Wishlist aangemaakt en gekoppeld!");
            onOpenChange(false);
            router.push(`/dashboard/wishlists/create/${eventId}/${participantId || currentUser.id}`);
            router.refresh();
          } else {
            toast.error(linkResult.error ?? "Aanmaken gelukt, maar koppelen mislukt");
          }
        } else {
          toast.error(result.success === false ? result.error : "Kon wishlist niet aanmaken");
        }
      } catch (error) {
        console.error("Create wishlist error:", error);
        toast.error("Er ging iets mis bij het aanmaken");
      }
    });
  }, [newWishlistName, currentUser, eventId, eventName, participantId, onOpenChange, router]);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "Enter" && !isPending) {
        if (selectedWishlistId) handleLinkExisting();
        else if (newWishlistName.trim()) handleCreateNew();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedWishlistId, newWishlistName, isPending, handleLinkExisting, handleCreateNew, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Wishlist Koppelen</DialogTitle>
          <DialogDescription>
            Koppel een bestaande wishlist of maak een nieuwe aan voor{" "}
            <span className="font-semibold">{eventName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Wishlist Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="existing-wishlist">Bestaande Wishlist</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadWishlists}
                disabled={isLoading || isPending}
                className="h-8 gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Ververs
              </Button>
            </div>

            <Select
              value={selectedWishlistId}
              onValueChange={(value) => {
                setSelectedWishlistId(value);
                setNewWishlistName("");
              }}
              disabled={isPending || isLoading}
            >
              <SelectTrigger id="existing-wishlist">
                <SelectValue placeholder="Selecteer een wishlist..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : wishlists.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Geen wishlists gevonden
                  </div>
                ) : (
                  wishlists.map((wishlist) => (
                    <SelectItem key={wishlist.id} value={wishlist.id}>
                      {wishlist.name} ({wishlist.items?.length || 0} items)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
  className="w-full"
  onClick={handleLinkExisting}
  disabled={!selectedWishlistId || isPending || isLoading}
>
  {(isPending || isLoading) ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Koppelen...
    </>
  ) : (
    <>
      <LinkIcon className="mr-2 h-4 w-4" />
      Koppel Bestaande
    </>
  )}
</Button>

<Button
  className="w-full"
  onClick={handleCreateNew}
  disabled={!newWishlistName.trim() || isPending || isLoading}
  variant="secondary"
>
  {(isPending || isLoading) ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Aanmaken...
    </>
  ) : (
    <>
      <Plus className="mr-2 h-4 w-4" />
      Maak Nieuwe Aan
    </>
  )}
</Button>

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuleer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
