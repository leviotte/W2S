// src/app/dashboard/event/[id]/_components/event-dashboard-client.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// --- Server Actions ---
// TOEKOMSTIGE STAP: Hier komt je server action om een event te updaten.
// import { updateEventAction } from './actions'; 

// --- Types ---
import type { Event, EventParticipant } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';
import type { AuthedUser } from '@/types/user';

// --- Componenten ---
import EventDetails from '@/components/event/EventDetails'; // Aanname van het pad
import WishlistsSection from '@/components/wishlist/WishlistsSection'; // Aanname
// ... andere component-imports

interface EventDashboardClientProps {
  event: Event;
  participants: EventParticipant[];
  wishlists: Record<string, Wishlist>;
  currentUser: AuthedUser;
  currentUserId: string;
  isOrganizer: boolean;
  drawnParticipantId?: string;
}

// FIX: Dit is nu een default export, wat de import-fout in page.tsx oplost.
export default function EventDashboardClient({
  event: initialEvent,
  participants,
  wishlists,
  currentUser,
  currentUserId,
  isOrganizer,
  drawnParticipantId,
}: EventDashboardClientProps) {

  // GOLD STANDARD: We beheren de staat van het event hier, op de client.
  const [currentEvent, setCurrentEvent] = useState<Event>(initialEvent);

  // Functie die we doorgeven aan child-componenten om updates uit te voeren.
  const handleUpdateEvent = async (data: Partial<Event>) => {
    // Optimistic UI Update: update de state onmiddellijk.
    const newEventState = { ...currentEvent, ...data };
    setCurrentEvent(newEventState);

    try {
      // TOEKOMSTIGE STAP: Roep hier je server action aan.
      // const result = await updateEventAction(currentEvent.id, data);
      // if (result.success) {
      //   toast.success("Update geslaagd!");
      //   // Optioneel: synchroniseer met de response van de server
      //   setCurrentEvent(result.data); 
      // } else {
      //   throw new Error(result.error);
      // }
      console.log("Simulating event update with:", data); // Placeholder
      toast.success("Evenement bijgewerkt (simulatie)!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Update mislukt. Wijzigingen worden teruggedraaid.");
      // Rollback: zet de state terug naar de originele staat bij een fout.
      setCurrentEvent(initialEvent); 
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 
        DE FIX: We geven nu de props door die EventDetails écht verwacht:
        - het volledige 'event' object (uit onze state)
        - de 'participants' array
        - 'isOrganizer' boolean
        - de 'updateEvent' functie
      */}
      <EventDetails
        event={currentEvent}
        participants={participants}
        isOrganizer={isOrganizer}
        updateEvent={handleUpdateEvent}
      />
      
      <WishlistsSection
          event={currentEvent}
          participants={participants}
          wishlists={wishlists}
          currentUser={currentUser}
          currentUserId={currentUserId}
      />

      {/* Hier komen de andere dashboard secties zoals Chat, Taken, etc. */}
    </div>
  );
}