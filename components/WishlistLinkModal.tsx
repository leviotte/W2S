"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const { wishlists, updateEvent, loadEvents, events } = useStore();
  const router = useRouter();

  const [selectedWishlistId, setSelectedWishlistId] = useState<string>("");
  const [showNewWishlistForm, setShowNewWishlistForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");

  /* -------------------------------------------------------
     Load events ONCE when modal is opened
  -------------------------------------------------------- */
  useEffect(() => {
    if (isOpen) loadEvents();
  }, [isOpen, loadEvents]);

  if (!isOpen) return null;

  /* -------------------------------------------------------
     Memoized event lookup
  -------------------------------------------------------- */
  const event = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );

  if (!event) return null;

  const participants = event.participants || {};
  const participant = participants[participantId];

  if (!participant) {
    toast.error("Deelnemer niet gevonden");
    return null;
  }

  /* -------------------------------------------------------
     Link existing wishlist
  -------------------------------------------------------- */
  const handleLinkWishlist = useCallback(async () => {
    if (!selectedWishlistId) return;

    try {
      const updatedParticipants = {
        ...participants,
        [participantId]: {
          ...participant,
          wishlistId: selectedWishlistId,
        },
      };

      await updateEvent(eventId, { participants: updatedParticipants });
      onClose();
    } catch {
      toast.error("Koppelen van wishlist is mislukt");
    }
  }, [participant, participantId, participants, selectedWishlistId, updateEvent, eventId, onClose]);

  /* -------------------------------------------------------
     Create new wishlist + link
  -------------------------------------------------------- */
  const handleCreateAndLinkWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = newWishlistName.trim();
    if (!cleanName) {
      toast.error("Geef je wishlist een naam");
      return;
    }

    try {
      const { createWishlist } = useStore.getState();

      const wishlistId = await createWishlist({
        name: cleanName,
        items: [],
        isPrivate: false,
      });

      const updatedParticipants = {
        ...participants,
        [participantId]: {
          ...participant,
          wishlistId,
        },
      };

      await updateEvent(eventId, { participants: updatedParticipants });
      onClose();
    } catch {
      toast.error("Aanmaken van wishlist is mislukt");
    }
  };

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex min-h-full items-center justify-center p-4"
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {showNewWishlistForm ? "Nieuwe Wishlist" : "Kies een Wishlist"}
            </h2>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* CREATE NEW FORM */}
          {showNewWishlistForm ? (
            <form onSubmit={handleCreateAndLinkWishlist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Naam van de wishlist
                </label>

                <input
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  placeholder="Bijvoorbeeld: Verjaardag"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewWishlistForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Terug
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive"
                >
                  Creëer en Link
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* LIST OF EXISTING WISHLISTS */}
              {wishlists.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {wishlists.map((wishlist) => (
                      <button
                        key={wishlist.id}
                        onClick={() => setSelectedWishlistId(wishlist.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                          selectedWishlistId === wishlist.id
                            ? "border-warm-olive bg-warm-olive/10"
                            : "border-gray-200 hover:border-warm-olive"
                        }`}
                      >
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">{wishlist.name}</h4>
                          <p className="text-sm text-gray-500">
                            {wishlist.items?.length || 0} items
                          </p>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedWishlistId === wishlist.id
                              ? "border-warm-olive bg-warm-olive"
                              : "border-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* BUTTON TO CREATE NEW */}
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard?tab=wishlists&subTab=create&event=${event.id}&participant=${participantId}`
                      )
                    }
                    className="w-full flex items-center justify-center space-x-2 p-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-warm-olive hover:text-warm-olive"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Creëer een nieuwe wishlist</span>
                  </button>

                  {/* ACTIONS */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Annuleer
                    </button>

                    <button
                      onClick={handleLinkWishlist}
                      disabled={!selectedWishlistId}
                      className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive disabled:opacity-50"
                    >
                      Link Wishlist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Je hebt nog geen wishlist…</p>

                  <button
                    onClick={() => setShowNewWishlistForm(true)}
                    className="flex items-center justify-center px-4 py-2 mx-auto bg-warm-olive text-white rounded-md hover:bg-cool-olive"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Maak er één aan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
