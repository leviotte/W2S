// src/app/dashboard/events/_components/events-list-section.tsx
"use client";

import EventCard from '@/components/events/event-card';
import type { Event } from '@/types/event';
import type { Wishlist } from '@/types/wishlist'; // ✅ IMPORT TOEGEVOEGD!

interface EventsListSectionProps {
  events: Event[];
  userId: string;
  emptyMessage: string;
  isPast?: boolean;
  wishlists?: Record<string, Wishlist>; // ✅ OPTIONAL FOR NOW
}

export default function EventsListSection({
  events,
  userId,
  emptyMessage,
  isPast = false,
  wishlists = {}, // ✅ DEFAULT EMPTY OBJECT
}: EventsListSectionProps) {
  
  // Empty state - EXACT ALS PRODUCTIE
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  // Event grid - 3 kolommen op desktop, 2 op tablet, 1 op mobile
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          currentUserId={userId}
          wishlists={wishlists}
        />
      ))}
    </div>
  );
}