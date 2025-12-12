"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon } from "lucide-react";

import { useCurrentUser } from "@/lib/store/use-auth-store";
import {
  getUserWishlistsAction,
  createWishlistAction,
} from "@/lib/server/actions/wishlist-actions";
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

interface WishlistLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
}

export function WishlistLinkModal({
  open,
  onOpenChange,
  eventId,
  eventName,
}: WishlistLinkModalProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [isPending, startTransition] = useTransition();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Load wishlists when modal opens
  useEffect(() => {
    if (open && currentUser) {
      loadWishlists();
    }
  }, [open, currentUser]);

  const loadWishlists = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const result = await getUserWishlistsAction(currentUser.id);

      if (result.success && result.data) { // ✅ Add check for result.data
        setWishlists(result.data);
      } else {
        toast.error(result.error || "Kon wishlists niet laden");
      }
    } catch (error) {
      console.error("Load wishlists error:", error);
      toast.error("Er ging iets mis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!selectedWishlistId) {
      toast.error("Selecteer een wishlist");
      return;
    }

    startTransition(async () => {
      // TODO: Implement link wishlist to event action
      toast.success("Wishlist gekoppeld aan event!");
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleCreateNew = async () => {
    if (!newWishlistName.trim()) {
      toast.error("Geef de wishlist een naam");
      return;
    }

    if (!currentUser) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    startTransition(async () => {
      const result = await createWishlistAction(currentUser.id, {
        name: newWishlistName.trim(),
        description: `Wishlist voor ${eventName}`,
        isPublic: false,
      });

      if (result.success) {
        toast.success("Wishlist aangemaakt en gekoppeld!");
        onOpenChange(false);
        router.push(`/dashboard/wishlists/${result.data}`);
        router.refresh();
      } else {
        toast.error(result.error || "Kon wishlist niet aanmaken");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Wishlist Koppelen</DialogTitle>
          <DialogDescription>
            Koppel een bestaande wishlist of maak een nieuwe aan voor dit
            event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Wishlist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bestaande Wishlist</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadWishlists}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ververs"
                )}
              </Button>
            </div>

            <Select
              value={selectedWishlistId}
              onValueChange={setSelectedWishlistId}
              disabled={isCreatingNew || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een wishlist..." />
              </SelectTrigger>
              <SelectContent>
                {wishlists.map((wishlist) => (
                  <SelectItem key={wishlist.id} value={wishlist.id}>
                    {wishlist.name} ({wishlist.items.length} items)
                  </SelectItem>
                ))}
                {wishlists.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Geen wishlists gevonden
                  </div>
                )}
              </SelectContent>
            </Select>

            <Button
              className="w-full"
              onClick={handleLinkExisting}
              disabled={!selectedWishlistId || isCreatingNew || isPending}
            >
              {isPending ? (
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
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Of
              </span>
            </div>
          </div>

          {/* New Wishlist */}
          <div className="space-y-4">
            <Label>Nieuwe Wishlist Aanmaken</Label>

            <Input
              placeholder="Naam van de nieuwe wishlist..."
              value={newWishlistName}
              onChange={(e) => setNewWishlistName(e.target.value)}
              disabled={!!selectedWishlistId || isPending}
              onFocus={() => {
                setIsCreatingNew(true);
                setSelectedWishlistId("");
              }}
              onBlur={() => {
                if (!newWishlistName.trim()) {
                  setIsCreatingNew(false);
                }
              }}
            />

            <Button
              className="w-full"
              onClick={handleCreateNew}
              disabled={!newWishlistName.trim() || isPending}
              variant="secondary"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                "Maak Nieuwe Aan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}