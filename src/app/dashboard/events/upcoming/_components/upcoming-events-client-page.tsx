// src/app/dashboard/events/upcoming/_components/upcoming-events-client-page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EventCard from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/event";
import { deleteEventAction } from "@/lib/server/actions/events";
import { toast } from "sonner";

interface UpcomingEventsClientPageProps {
  initialEvents: Event[];
  userId: string;
}

export default function UpcomingEventsClientPage({
  initialEvents,
  userId,
}: UpcomingEventsClientPageProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);

  // Filter upcoming events
  const upcomingEvents = events.filter((event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (event.time) {
      const dateTime = new Date(`${event.date}T${event.time}`);
      return dateTime > now;
    } else {
      eventDate.setDate(eventDate.getDate() + 1);
      return eventDate > now;
    }
  });

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEventAction(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
      toast.success("Evenement verwijderd");
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Fout bij verwijderen evenement");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-start mb-4">
        <h1 className="text-2xl font-bold text-accent my-2">
          Aankomende evenementen
        </h1>
        <Button
          className="bg-warm-olive text-white px-4 py-2 rounded-md hover:bg-cool-olive ml-4"
          onClick={() => router.push("/dashboard/events/create")}
        >
          Nieuw Evenement
        </Button>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={userId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-accent">Geen aankomende evenementen gevonden.</p>
      )}
    </div>
  );
}