/**
 * src/app/dashboard/event/[id]/_components/drawn-name-section.tsx
 *
 * GOLD STANDARD VERSIE: Met correcte types, state-management en prop-syntax.
 */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { NameDrawingAnimation } from "./name-drawing-animation"; // Zorg dat het pad correct is
import { useAuthStore } from "@/lib/store/use-auth-store";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { Button } from "@/components/ui/button";
// VERBETERING: Gebruik onze gecentraliseerde, robuuste types
import { Event, EventParticipant } from "@/types/event"; 
import { Wishlist } from "@/types/wishlist"; // Zorg dat dit type bestaat

interface DrawnNameSectionProps {
  drawnName?: string;
  drawnParticipantId?: string;
  participants: EventParticipant[]; // Gebruik het EventParticipant type
  onNameDrawn: (name: string) => void;
  participantsTobeDrawn: EventParticipant[]; // Gebruik het EventParticipant type
  eventId: string;
  showDrawingModal: boolean;
  setShowDrawingModal: React.Dispatch<React.SetStateAction<boolean>>;
  event: Event; // Gebruik het Event type, geen 'any'
}

export default function DrawnNameSection({
  drawnName,
  drawnParticipantId,
  participants,
  onNameDrawn,
  participantsTobeDrawn,
  eventId,
  showDrawingModal,
  setShowDrawingModal,
  event,
}: DrawnNameSectionProps) {
  const router = useRouter();
  // DE FIX: 'updateEvent' is nu correct beschikbaar in de store.
  const { updateEvent } = useAuthStore(); 
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);

  const drawnParticipant = participants.find((p) => p.id === drawnParticipantId);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!drawnParticipant?.wishlistId) return;
      const snap = await getDoc(doc(db, "wishlists", drawnParticipant.wishlistId));
      if (snap.exists()) {
        setWishlist(snap.data() as Wishlist);
      }
    };
    loadWishlist();
  }, [drawnParticipant?.wishlistId]);

  useEffect(() => {
    if (!event?.registrationDeadline || !participants.length) return;
    const now = new Date();
    // Zorg ervoor dat 'registrationDeadline' een Date object is. Zod doet dit voor ons.
    const deadline = event.registrationDeadline; 
    if (deadline && now >= deadline) {
      updateEvent(event.id!, { maxParticipants: participants.length });
    }
  }, [event, participants.length, updateEvent]);
  
  const allowToDraw = useMemo(() => {
    if (!event) return false;
    const now = new Date();
    const deadline = event.registrationDeadline;
    const currentCount = Object.keys(event.participants ?? {}).length;

    if (event.allowSelfRegistration) {
      return (
        event.maxParticipants === currentCount ||
        (deadline && now >= deadline) ||
        event.allowDrawingNames
      );
    }
    return true;
  }, [event]);

  const handleWishlistAction = useCallback(() => {
    if (!drawnParticipant) return;
    if (wishlist) {
      router.push(`/dashboard/wishlist/${wishlist.slug}/${eventId}`);
    } else {
      router.push(`/dashboard/event/${eventId}/request/${drawnParticipant.id}`);
    }
  }, [wishlist, router, eventId, drawnParticipant]);

  return (
    <>
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/75 backdrop-blur-sm">
          <NameDrawingAnimation
            isOpen={showDrawingModal}
            // CORRECTIE: Prop-syntax voor functies
            onClose={() => setShowDrawingModal(false)}
            names={participantsTobeDrawn.map((p) => `${p.firstName} ${p.lastName}`)}
            onDraw={onNameDrawn}
          />
        </div>
      )}

      <div className="mb-6 rounded-xl border border-white/20 bg-white/40 p-6 shadow-xl backdrop-blur-md">
        {allowToDraw && (
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Shhh! Jij koopt voor:
          </h2>
        )}

        {drawnName ? (
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">{drawnName}</div>
            <Button variant="ghost" onClick={handleWishlistAction}>
              <Gift className="mr-2 h-5 w-5" />
              <span>
                {drawnParticipant?.wishlistId ? "Bekijk wenslijst" : "Vraag wenslijst aan"}
              </span>
            </Button>
          </div>
        ) : (
          <>
            {allowToDraw ? (
              <Button
                onClick={() => setShowDrawingModal(true)}
                className="w-full"
              >
                <Gift className="mr-2 h-5 w-5" />
                <span>Trek een naam</span>
              </Button>
            ) : (
              <p className="text-gray-800">
                Namen trekken kan pas als de deadline is verstreken of het maximaal aantal deelnemers is bereikt.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}