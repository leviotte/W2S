// src/app/dashboard/event/[id]/_components/drawn-name-section.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/client/firebase";
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
  participantsToDraw: EventParticipant[]; // FIX: Naam gecorrigeerd
  onDraw: (name: string) => void;         // FIX: Naam gecorrigeerd
}

export default function DrawnNameSection({
  event,
  drawnName,
  drawnParticipantId,
  participants,
  onDraw, // FIX: Naam gecorrigeerd
  participantsToDraw, // FIX: Naam gecorrigeerd
}: DrawnNameSectionProps) {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  const drawnParticipant = useMemo(
    () => participants.find((p) => p.id === drawnParticipantId),
    [participants, drawnParticipantId]
  );

  useEffect(() => {
    const loadWishlist = async () => {
      if (!drawnParticipant?.wishlistId) {
        setWishlist(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "wishlists", drawnParticipant.wishlistId));
        setWishlist(snap.exists() ? (snap.data() as Wishlist) : null);
      } catch (error) {
        console.error("Fout bij het ophalen van de wenslijst:", error);
        toast.error("Kon de wenslijst niet laden.");
      }
    };
    loadWishlist();
  }, [drawnParticipant?.wishlistId]);

  const handleWishlistAction = useCallback(() => {
    if (!drawnParticipant) return;
    if (drawnParticipant.wishlistId && wishlist) {
      // Aanname: de slug is onderdeel van het wishlist object
      router.push(`/dashboard/wishlist/${wishlist.slug || wishlist.id}`);
    } else {
      toast.info(`${drawnParticipant.firstName} heeft nog geen wenslijst gedeeld.`);
    }
  }, [wishlist, router, drawnParticipant]);

  const handleDraw = (name: string) => {
    onDraw(name); // Gebruik de correcte prop
    setShowDrawingModal(false);
  };

  // Logica om te bepalen of er getrokken mag worden
  const allowToDraw = event.allowDrawingNames && !drawnName;

  return (
    <>
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <NameDrawingAnimation
            isOpen={showDrawingModal}
            onClose={() => setShowDrawingModal(false)} // FIX: Correcte prop naam
            names={participantsToDraw.map((p) => `${p.firstName} ${p.lastName}`)}
            onDraw={handleDraw} // FIX: Correcte prop naam
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
              <Button onClick={handleWishlistAction} variant="secondary" className="w-full">
                <Gift className="mr-2 h-4 w-4" />
                {drawnParticipant?.wishlistId ? "Bekijk wenslijst" : "Wenslijst nog niet beschikbaar"}
              </Button>
            </div>
          ) : allowToDraw ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">Tijd om een naam te trekken!</p>
              <Button onClick={() => setShowDrawingModal(true)} className="w-full">
                <Gift className="mr-2 h-4 w-4" />
                Trek een naam
              </Button>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Namen trekken is nog niet gestart door de organisator.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}