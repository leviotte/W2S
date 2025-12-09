// src/components/event/ParticipantProgress.tsx
"use client";

import React, { FC, useMemo, useCallback } from "react";
// GOLD STANDARD FIX: Importeer de 'source of truth' types, verwijder lokale definities.
import type { Event, EventParticipant } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";

interface ParticipantProgressProps {
  event: Event;
  participants: EventParticipant[]; // Verwacht nu de correcte array.
  currentUserId: string;
  wishlists: Record<string, Wishlist>; // Verwacht het correcte, gevalideerde type.
  drawnParticipantId?: string; // Optioneel, want niet elke user heeft getrokken.
}

const ParticipantProgress: FC<ParticipantProgressProps> = ({
  event,
  participants,
  currentUserId,
  wishlists,
  drawnParticipantId,
}) => {
  // Aangezien de parent nu correct een array doorgeeft, is de conversie niet meer nodig.
  // const participantsArray = participants;

  const currentUserHasDrawnName = useMemo(
    () => event.isLootjesEvent && !!event.drawnNames?.[currentUserId],
    [event.isLootjesEvent, event.drawnNames, currentUserId]
  );

  const currentUserParticipant = useMemo(
      () => participants.find(p => p.id === currentUserId),
      [participants, currentUserId]
  );
  
  const currentUserHasWishlist = !!currentUserParticipant?.wishlistId;

  const currentUserRecipient = useMemo(() => {
    if (!drawnParticipantId) return null;
    return participants.find((p) => p.id === drawnParticipantId);
  }, [participants, drawnParticipantId]);
  
  // ... De rest van je logica kan grotendeels hetzelfde blijven ...

  return (
    <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Jouw voortgang</h3>
      <div className="text-gray-700">
        {!currentUserHasWishlist 
            ? "Je hebt nog geen verlanglijstje gekoppeld."
            : "Alle stappen voltooid!"
        }
      </div>
    </div>
  );
};

export default ParticipantProgress;