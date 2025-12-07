// src/app/dashboard/event/[id]/_components/event-dashboard-client.tsx
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { toast } from "sonner";
import { ErrorBoundary } from "react-error-boundary";

// --- Types ---
import type { Event, EventParticipant } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import type { AuthedUser } from "@/types";

// --- Actions & Hooks ---
import { updateDrawnNameAction, updateEventAction } from "../actions";
import { useEventParticipants } from "@/hooks/useEventParticipants";

// --- Componenten ---
import ErrorFallback from "@/components/ErrorFallback";
import EventDetails from "@/components/event/EventDetails";
import DrawnNameSection from "./drawn-name-section";
import { PartyPrepsSection } from "@/components/party-preps/PartyPrepsSection";
import AdvancedEventProgressChecklist from "@/components/event/AdvancedEventProgressChecklist";
import ParticipantProgress from "@/components/event/ParticipantProgress";
import WishlistsSection from "@/components/wishlist/WishlistsSection";

interface EventDashboardClientProps {
  initialEvent: Event;
  currentUser: AuthedUser | null;
}

export function EventDashboardClient({ initialEvent, currentUser }: EventDashboardClientProps) {
  const router = useRouter();
  const eventId = initialEvent.id;

  const [event, setEvent] = useState<Event>(initialEvent);
  const [wishlists, setWishlists] = useState<Record<string, Wishlist>>({});
  const [isPending, startTransition] = useTransition();

  // Realtime listener voor het event-document
  useEffect(() => {
    const eventRef = doc(db, "events", eventId);
    const unsubscribe = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ ...docSnap.data(), id: docSnap.id } as Event);
      } else {
        toast.error("Evenement niet meer gevonden.");
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [eventId, router]);

  // Haal deelnemers op met een custom hook
  const participants = useEventParticipants(event);

  // Listener voor wenslijsten
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    const wishlistIds = participants.map(p => p.wishlistId).filter(Boolean) as string[];
    if (wishlistIds.length === 0) return;

    const unsubscribers = wishlistIds.map((wishlistId) =>
      onSnapshot(doc(db, "wishlists", wishlistId), (docSnap) => {
        if (docSnap.exists()) {
          setWishlists(prev => ({ ...prev, [wishlistId]: docSnap.data() as Wishlist }));
        }
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [participants]);
  
  // Memoized waarden
  const currentUserId = currentUser?.id ?? "";
  const isOrganizer = useMemo(() => event?.organizerId === currentUserId, [event, currentUserId]);
  
  const { drawnName, drawnParticipantId } = useMemo(() => {
    const dId = event?.drawnNames?.[currentUserId];
    const participant = dId ? participants.find(p => p.id === dId) : undefined;
    return {
      drawnName: participant ? `${participant.firstName} ${participant.lastName}` : undefined,
      drawnParticipantId: dId,
    };
  }, [event?.drawnNames, participants, currentUserId]);

  const participantsToDraw = useMemo(() => {
    const excludedIds = event?.exclusions?.[currentUserId] || [];
    return participants.filter(p => p.id !== currentUserId && !excludedIds.includes(p.id));
  }, [participants, event?.exclusions, currentUserId]);

  const handleNameDrawn = (name: string) => {
    startTransition(async () => {
      const drawnParticipant = participants.find(p => `${p.firstName} ${p.lastName}`.trim() === name.trim());
      if (drawnParticipant) {
        await updateDrawnNameAction(eventId, currentUserId, drawnParticipant.id);
      }
    });
  };
  
  // Wrapper voor de generieke update-actie
  const handleUpdateEvent = (data: Partial<Event>) => {
    startTransition(async () => {
       await updateEventAction(eventId, data);
    });
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div
        style={{ backgroundImage: `url(${event.backgroundImage || '/chatBackground.png'})` }}
        className="fixed inset-0 -z-10 h-full w-full bg-cover bg-center"
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <EventDetails event={event} participants={participants} updateEvent={handleUpdateEvent} />
          {event.isLootjesEvent && (
            <DrawnNameSection
              event={event} // FIX: Pass het hele event object
              drawnName={drawnName}
              drawnParticipantId={drawnParticipantId}
              participants={participants}
              onNameDrawn={handleNameDrawn} // FIX: Correcte prop naam
              participantsToDraw={participantsToDraw}
            />
          )}
          <PartyPrepsSection
            event={event} // FIX: Pass het hele event object
            isOrganizer={isOrganizer}
            participants={participants}
            currentUserId={currentUserId}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isOrganizer ? (
            <AdvancedEventProgressChecklist
              event={event}
              participants={participants}
              wishlists={wishlists}
            />
          ) : (
            <ParticipantProgress
              event={event}
              participants={participants}
              currentUserId={currentUserId}
              wishlists={wishlists}
              drawnParticipantId={drawnParticipantId}
            />
          )}
          <WishlistsSection
            participants={participants}
            currentUserId={currentUserId}
            event={event} // FIX: Pass het hele event object
            currentUser={currentUser}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}