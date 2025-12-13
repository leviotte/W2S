// src/app/dashboard/event/[id]/_components/event-dashboard-client.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// --- Server Actions ---
// TOEKOMSTIGE STAP: Hier komt je server action om een event te updaten.
// import { updateEventAction } from '../actions'; 

// --- Types ---
import type { Event, EventParticipant } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';
// --- FIX: We gebruiken nu overal UserProfile ---
import type { UserProfile } from '@/types/user';

// --- Componenten ---
import EventDetails from '@/components/event/EventDetails';
// We moeten nog een WishlistsSection component migreren. Voor nu commenten we dit uit.
// import WishlistsSection from '@/components/wishlist/WishlistsSection'; 

interface EventDashboardClientProps {
  event: Event;
  participants: EventParticipant[];
  wishlists: Record<string, Wishlist>;
  currentUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    photoURL?: string | null;
  };
  currentUserId: string;
  isOrganizer: boolean;
  drawnParticipantId?: string;
}

export default function EventDashboardClient({
  event: initialEvent,
  participants,
  wishlists,
  currentUser,
  currentUserId,
  isOrganizer,
  drawnParticipantId,
}: EventDashboardClientProps) {

  const [currentEvent, setCurrentEvent] = useState<Event>(initialEvent);

  const handleUpdateEvent = async (data: Partial<Event>) => {
    const newEventState = { ...currentEvent, ...data };
    setCurrentEvent(newEventState);

    try {
      // TOEKOMSTIGE STAP: Roep hier je server action aan.
      // const result = await updateEventAction(currentEvent.id, data);
      // if (!result.success) throw new Error(result.error);
      
      console.log("Simulating event update with:", data); // Placeholder
      toast.success("Evenement bijgewerkt (simulatie)!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Update mislukt. Wijzigingen worden teruggedraaid.");
      setCurrentEvent(initialEvent); 
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <EventDetails
        event={currentEvent}
        participants={participants}
        isOrganizer={isOrganizer}
        updateEvent={handleUpdateEvent}
      />
      
      {/* 
        NOTE: WishlistsSection is nog niet gemigreerd en geeft waarschijnlijk veel errors.
        We commenten dit voor nu uit zodat we ons kunnen focussen.
      */}
      {/* <WishlistsSection
          event={currentEvent}
          participants={participants}
          wishlists={wishlists}
          currentUser={currentUser}
          currentUserId={currentUserId}
      /> */}

      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">Wishlists Section (nog te migreren)</p>
      </div>

      {/* Hier komen de andere dashboard secties zoals Chat, Taken, etc. */}
    </div>
  );
}