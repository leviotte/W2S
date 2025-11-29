"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import NameDrawingAnimation from "./NameDrawingAnimation";
import { useStore } from "@/store/useStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  wishlistId?: string;
}

interface DrawnNameSectionProps {
  drawnName?: string;
  drawnParticipantId?: string;
  participants: Participant[];
  onNameDrawn: (name: string) => void;
  participantsTobeDrawn: Participant[];
  eventId: string;
  showDrawingModal: boolean;
  setShowDrawingModal: React.Dispatch<React.SetStateAction<boolean>>;
  event: any;
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
  const { updateEvent } = useStore();
  const [wishlist, setWishlist] = useState<any>();

  const drawnParticipant = participants.find((p) => p.id === drawnParticipantId);

  // -----------------------------
  // FETCH WISHLIST
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      if (!drawnParticipant?.wishlistId) return;

      const snap = await getDoc(doc(db, "wishlists", drawnParticipant.wishlistId));
      if (mounted && snap.exists()) {
        setWishlist(snap.data());
      }
    };

    loadWishlist();
    return () => {
      mounted = false;
    };
  }, [drawnParticipant?.wishlistId]);

  // -----------------------------
  // AUTO-UPDATE MAX PARTICIPANTS
  // -----------------------------
  useEffect(() => {
    if (!event?.registrationDeadline || !participants.length) return;

    const now = new Date();
    const deadline = new Date(event.registrationDeadline);

    if (now >= deadline) {
      updateEvent(event.id, { maxParticipants: participants.length });
    }
  }, [event, participants.length, updateEvent]);

  // -----------------------------
  // DETERMINE IF USER CAN DRAW
  // -----------------------------
  const allowToDraw = useMemo(() => {
    if (!event) return false;

    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

    const currentCount = Object.keys(event?.participants ?? {}).length;

    if (event.allowSelfRegistration) {
      return (
        event.maxParticipants === currentCount ||
        (deadline && now >= deadline) ||
        event.allowDrawingNames
      );
    }

    return true;
  }, [event]);

  // -----------------------------
  // NAVIGATION HANDLER
  // -----------------------------
  const handleWishlistAction = useCallback(() => {
    if (!drawnParticipant) return;

    if (wishlist) {
      router.push(
        `/dashboard/wishlist/${wishlist.slug}/${eventId}?tab=wishlists&subTab=event-details`
      );
    } else {
      router.push(
        `/dashboard/event/${eventId}/request/${drawnParticipant.id}?tab=event&subTab=request&type=wishlist`
      );
    }
  }, [wishlist, router, eventId, drawnParticipant]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/75 backdrop-blur-sm">
          <NameDrawingAnimation
            isOpen={showDrawingModal}
            onClose={() => setShowDrawingModal(false)}
            names={participantsTobeDrawn.map((p) => `${p.firstName} ${p.lastName}`)}
            onNameDrawn={onNameDrawn}
          />
        </div>
      )}

      <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-white/20">
        {allowToDraw && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Shhh! Jij koopt voor:
          </h2>
        )}

        {drawnName ? (
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">{drawnName}</div>

            <button
              onClick={handleWishlistAction}
              className="inline-flex items-center space-x-2 hover:text-cool-olive transition-colors"
            >
              <Gift className="h-5 w-5" />
              <span>
                {drawnParticipant?.wishlistId ? "View wishlist" : "Request wishlist"}
              </span>
            </button>
          </div>
        ) : (
          <>
            {allowToDraw ? (
              <button
                onClick={() => setShowDrawingModal(true)}
                className="w-full bg-warm-olive text-white px-4 py-3 rounded-md hover:bg-cool-olive transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Gift className="h-5 w-5 mr-2" />
                <span>Trek een naam</span>
              </button>
            ) : (
              <p className="text-gray-800">
                Trek een naam kan alleen gestart worden wanneer de deadline is verstreken
                of het maximaal aantal deelnemers is bereikt.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
