"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { loadWishlistsAction, createWishlistAction, linkWishlistToEventAction } from "@/app/dashboard/wishlists/actions";
import type { Wishlist } from "@/types/wishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WishlistLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  participantId: string;
}

export default function WishlistLinkModal({
  isOpen,
  onClose,
  eventId,
  participantId,
}: WishlistLinkModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [showNewWishlistForm, setShowNewWishlistForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");

  // Load wishlists when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWishlists();
    }
  }, [isOpen]);

  const loadWishlists = async () => {
    setIsLoading(true);
    const result = await loadWishlistsAction();
    if (result.success) {
      setWishlists(result.wishlists);
    }
    setIsLoading(false);
  };

  const handleLinkWishlist = useCallback(async () => {
    if (!selectedWishlistId) return;

    startTransition(async () => {
      const result = await linkWishlistToEventAction(
        eventId,
        participantId,
        selectedWishlistId
      );

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  }, [eventId, participantId, selectedWishlistId, router, onClose]);

  const handleCreateAndLinkWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = newWishlistName.trim();
    if (!cleanName) {
      toast.error("Geef je wishlist een naam");
      return;
    }

    startTransition(async () => {
      const result = await createWishlistAction({
        name: cleanName,
        items: [],
        isPrivate: false,
        eventId,
        participantId,
      });

      if (result.success) {
        toast.success(result.message);
        
        // Redirect is handled by the action if eventId was provided
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.refresh();
        }
        
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleNavigateToCreate = () => {
    router.push(
      `/dashboard/wishlists/create?event=${eventId}&participant=${participantId}`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {showNewWishlistForm ? "Nieuwe Wishlist" : "Kies een Wishlist"}
            </h2>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              disabled={isPending}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* LOADING STATE */}
          {isLoading && !showNewWishlistForm ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : showNewWishlistForm ? (
            /* CREATE NEW FORM */
            <form onSubmit={handleCreateAndLinkWishlist} className="space-y-4">
              <div>
                <Label htmlFor="wishlistName">Naam van de wishlist</Label>
                <Input
                  id="wishlistName"
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="Bijvoorbeeld: Verjaardag"
                  required
                  disabled={isPending}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewWishlistForm(false)}
                  disabled={isPending}
                >
                  Terug
                </Button>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aanmaken...
                    </>
                  ) : (
                    "Creëer en Link"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* LIST OF EXISTING WISHLISTS */
            <div className="space-y-4">
              {wishlists.length > 0 ? (
                <>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {wishlists.map((wishlist) => (
                      <button
                        key={wishlist.id}
                        onClick={() => setSelectedWishlistId(wishlist.id)}
                        disabled={isPending}
                        className={`
                          w-full flex items-center justify-between p-4 rounded-lg border-2 
                          transition-all duration-200
                          ${selectedWishlistId === wishlist.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                          }
                          ${isPending ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">
                            {wishlist.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {wishlist.items?.length || 0} items
                          </p>
                        </div>

                        <div
                          className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                            ${selectedWishlistId === wishlist.id
                              ? "border-primary bg-primary"
                              : "border-gray-300"
                            }
                          `}
                        >
                          {selectedWishlistId === wishlist.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* BUTTON TO CREATE NEW */}
                  <button
                    onClick={() => setShowNewWishlistForm(true)}
                    disabled={isPending}
                    className="w-full flex items-center justify-center space-x-2 p-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Creëer een nieuwe wishlist</span>
                  </button>

                  {/* ACTIONS */}
                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isPending}
                    >
                      Annuleren
                    </Button>

                    <Button
                      onClick={handleLinkWishlist}
                      disabled={!selectedWishlistId || isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Koppelen...
                        </>
                      ) : (
                        "Link Wishlist"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* EMPTY STATE */
                <div className="text-center py-8 space-y-4">
                  <div className="text-6xl">🎁</div>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">
                      Je hebt nog geen wishlist
                    </p>
                    <p className="text-sm text-gray-500">
                      Maak er één aan om te koppelen aan dit evenement
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowNewWishlistForm(true)}
                    disabled={isPending}
                    className="mt-4"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Maak een wishlist aan
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}