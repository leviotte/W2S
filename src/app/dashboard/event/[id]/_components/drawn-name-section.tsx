/**
 * src/app/dashboard/event/[id]/_components/drawn-name-section.tsx
 *
 * GOLD STANDARD VERSIE 2.1: Met gecorrigeerde imports en JSX syntax.
 */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { toast } from "sonner"; // CORRECTIE: 'toast' is nu geïmporteerd

import { db } from "@/lib/client/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEventMutations } from "@/hooks/useEventMutations"; // CORRECTIE: Pad naar de hook is nu juist

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import NameDrawingAnimation from "@/components/event/NameDrawingAnimation";

import type { Event, EventParticipant } from "@/types/event"; 
import type { Wishlist } from "@/types/wishlist"; 

interface DrawnNameSectionProps {
  event: Event;
  drawnName?: string;
  drawnParticipantId?: string;
  participants: EventParticipant[];
  participantsTobeDrawn: EventParticipant[];
  onNameDrawn: (name: string) => void;
}

export default function DrawnNameSection({
  event,
  drawnName,
  drawnParticipantId,
  participants,
  onNameDrawn,
  participantsTobeDrawn,
}: DrawnNameSectionProps) {
  const router = useRouter();
  const { updateEvent } = useEventMutations(event.id);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  const drawnParticipant = useMemo(() => 
    participants.find((p) => p.id === drawnParticipantId), 
    [participants, drawnParticipantId]
  );

  useEffect(() => {
    const loadWishlist = async () => {
      if (!drawnParticipant?.wishlistId) {
        setWishlist(null);
        return;
      }
      const snap = await getDoc(doc(db, "wishlists", drawnParticipant.wishlistId));
      setWishlist(snap.exists() ? snap.data() as Wishlist : null);
    };
    loadWishlist();
  }, [drawnParticipant?.wishlistId]);

  const allowToDraw = useMemo(() => {
    const now = new Date();
    const deadline = event.registrationDeadline; // is al een Date object
    const currentCount = Object.keys(event.participants).length;

    if (event.allowSelfRegistration) {
      return (
        event.maxParticipants === currentCount ||
        (deadline && now >= deadline) ||
        event.allowDrawingNames
      );
    }
    return true; // Altijd toegestaan bij manuele events.
  }, [event]);

  const handleWishlistAction = useCallback(() => {
    if (!drawnParticipant) return;
    if (drawnParticipant.wishlistId && wishlist) {
      router.push(`/dashboard/wishlist/${wishlist.id}`);
    } else {
      toast.info(`Je kan nog geen wenslijst aanvragen voor ${drawnParticipant.firstName}.`);
    }
  }, [wishlist, router, drawnParticipant]);

  return (
    <>
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <NameDrawingAnimation
            isOpen={showDrawingModal}
            onClose={() => setShowDrawingModal(false)} // CORRECTIE: Juiste prop-syntax
            names={participantsTobeDrawn.map((p) => `${p.firstName} ${p.lastName}`)}
            onDraw={onNameDrawn} // CORRECTIE: Juiste prop-syntax
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lootje Trekken</CardTitle>
        </CardHeader>
        <CardContent>
          {drawnName ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">Shhh! Jij koopt voor:</p>
              <p className="text-2xl font-bold">{drawnName}</p>
              <Button onClick={handleWishlistAction} variant="secondary" className="w-full"> {/* CORRECTIE: onClick */}
                <Gift className="mr-2 h-4 w-4" />
                {drawnParticipant?.wishlistId ? "Bekijk wenslijst" : "Wenslijst nog niet beschikbaar"}
              </Button>
            </div>
          ) : allowToDraw ? (
            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">Tijd om een naam te trekken!</p>
                <Button onClick={() => setShowDrawingModal(true)} className="w-full"> {/* CORRECTIE: onClick */}
                    <Gift className="mr-2 h-4 w-4" />
                    Trek een naam
                </Button>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Namen trekken kan pas als de deadline is verstreken of het maximaal aantal deelnemers is bereikt.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}