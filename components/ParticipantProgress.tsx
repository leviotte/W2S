// src/components/ParticipantProgress.tsx
"use client";

import React, { FC, useMemo, useCallback } from "react";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  confirmed: boolean;
  wishlistId?: string;
}

interface WishlistItem {
  purchasedBy?: Record<string, string[]>;
}

interface Wishlist {
  items?: WishlistItem[];
}

interface Event {
  id: string;
  isLootjesEvent?: boolean;
}

interface ParticipantProgressProps {
  event: Event;
  drawnNames?: Record<string, string>;
  participants: Participant[] | Record<string, Participant>;
  currentUserId: string;
  wishlists?: Record<string, Wishlist>;
}

const ParticipantProgress: FC<ParticipantProgressProps> = ({
  event,
  drawnNames = {},
  participants,
  currentUserId,
  wishlists = {},
}) => {
  const participantsArray: Participant[] = useMemo(
    () => (Array.isArray(participants) ? participants : Object.values(participants || {})),
    [participants]
  );

  const currentUserHasDrawnName = useMemo(
    () => event?.isLootjesEvent && currentUserId in drawnNames,
    [event?.isLootjesEvent, drawnNames, currentUserId]
  );

  const currentUserHasWishlist = useMemo(
    () => participantsArray.some((p) => p.id === currentUserId && p.wishlistId),
    [participantsArray, currentUserId]
  );

  const currentUserRecipient = useMemo(() => {
    if (!event?.isLootjesEvent || !currentUserHasDrawnName) return null;
    return participantsArray.find((p) => p.id === drawnNames[currentUserId]);
  }, [event?.isLootjesEvent, currentUserHasDrawnName, participantsArray, drawnNames, currentUserId]);

  const hasParticipantPurchasedForEvent = useCallback(
    (participantId: string, eventId: string) => {
      return Object.values(wishlists).some((wishlist) =>
        wishlist.items?.some((item) => item.purchasedBy?.[eventId]?.includes(participantId))
      );
    },
    [wishlists]
  );

  const currentUserHasBoughtGift = useMemo(
    () => hasParticipantPurchasedForEvent(currentUserId, event.id),
    [currentUserId, event.id, hasParticipantPurchasedForEvent]
  );

  const progressMessage = useMemo(() => {
    if (event?.isLootjesEvent) {
      if (!currentUserHasDrawnName) return "Je hebt nog geen naam getrokken.";

      const allUsersHaveDrawnNames = Object.keys(drawnNames).length === participantsArray.length;
      if (!allUsersHaveDrawnNames)
        return "Je hebt een naam getrokken, maar sommige deelnemers hebben nog geen naam getrokken.";
    }

    if (!currentUserHasWishlist) return "Je hebt nog geen verlanglijstje gekoppeld.";

    const allUsersHaveWishlists = participantsArray.every((p) => p.wishlistId);
    if (!allUsersHaveWishlists)
      return "Je hebt een verlanglijstje toegevoegd, maar sommige deelnemers hebben nog geen verlanglijstje toegevoegd.";

    if (!currentUserHasBoughtGift)
      return event?.isLootjesEvent
        ? `Je hebt nog geen cadeau gekocht voor ${currentUserRecipient?.firstName || "je getrokken persoon"}.`
        : "Je hebt nog geen cadeau gekocht.";

    const allParticipantsBoughtGifts = participantsArray.every((p) =>
      hasParticipantPurchasedForEvent(p.id, event.id)
    );
    if (!allParticipantsBoughtGifts)
      return "Je hebt een cadeau gekocht, maar sommige deelnemers hebben nog geen cadeau gekocht.";

    return "Gebruik #wish2Share om je ervaring te delen op social media!";
  }, [
    event?.isLootjesEvent,
    event.id,
    currentUserHasDrawnName,
    currentUserHasWishlist,
    currentUserHasBoughtGift,
    currentUserRecipient,
    drawnNames,
    participantsArray,
    hasParticipantPurchasedForEvent,
  ]);

  const showSocialMediaMessage = useMemo(
    () =>
      (event?.isLootjesEvent ? currentUserHasDrawnName : true) &&
      currentUserHasWishlist &&
      currentUserHasBoughtGift,
    [event?.isLootjesEvent, currentUserHasDrawnName, currentUserHasWishlist, currentUserHasBoughtGift]
  );

  return (
    <div
      className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 mb-6"
      style={{ boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}
    >
      <h3 className="text-lg font-semibold mb-4">Jouw voortgang</h3>

      <div className="text-gray-700">
        {showSocialMediaMessage ? (
          <span>
            Gebruik{" "}
            <span className="font-bold text-olive-600">#wish2Share</span> om je ervaring te delen op social media!
          </span>
        ) : (
          <span>{progressMessage}</span>
        )}
      </div>
    </div>
  );
};

export default ParticipantProgress;
