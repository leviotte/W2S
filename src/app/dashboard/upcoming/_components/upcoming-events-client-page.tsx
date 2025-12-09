// src/app/dashboard/upcoming/_components/upcoming-events-client-page.tsx
'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@/types/event';
import { deleteEventAction } from './actions'; // NIEUWE SERVER ACTION
import { toast } from 'sonner';
import EventCard from '@/components/event/event-card'; // We gebruiken een generieke EventCard

interface ClientPageProps {
  initialEvents: Event[];
  userId: string;
}

export default function UpcomingEventsClientPage({
  initialEvents,
  userId,
}: ClientPageProps) {
  // Lokale state voor de events, zodat we de UI optimistisch kunnen updaten.
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const handleDelete = async (eventId: string, eventName: string) => {
    if (!confirm(`Weet je zeker dat je het evenement "${eventName}" wilt verwijderen?`)) {
      return;
    }

    // Optimistic UI Update: verwijder het event meteen uit de lijst.
    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    // Roep de server action aan.
    const result = await deleteEventAction(eventId);

    if (result.success) {
      toast.success(`Evenement "${eventName}" is verwijderd!`);
    } else {
      toast.error(`Kon het evenement niet verwijderen: ${result.message}`);
      // Rollback: voeg het event terug toe als de server-actie faalt.
      setEvents(initialEvents);
    }
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return events.reduce(
      (acc, event) => {
        const eventDate = new Date(event.date);
        if (eventDate >= now) {
          acc.upcomingEvents.push(event);
        } else {
          acc.pastEvents.push(event);
        }
        return acc;
      },
      { upcomingEvents: [] as Event[], pastEvents: [] as Event[] }
    );
  }, [events]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Aankomend</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={userId}
                onDelete={() => handleDelete(event.id, event.name)}
              />
            ))
          ) : (
            <p>Geen aankomende evenementen gevonden.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Voorbij</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pastEvents.length > 0 ? (
            pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={userId}
                onDelete={() => handleDelete(event.id, event.name)}
              />
            ))
          ) : (
            <p>Geen voorbije evenementen gevonden.</p>
          )}
        </div>
      </div>
    </div>
  );
}