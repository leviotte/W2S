// src/app/dashboard/events/upcoming/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import UpcomingEventsClientPage from './_components/upcoming-events-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { getEventsForUser } from '@/lib/server/actions/events';
import type { Event, EventMessage } from '@/types/event'; // ✅ import EventMessage
import { tsToIso } from '@/lib/client/tsToIso'; // ✅ import tsToIso helper
import { DateTime } from 'luxon';

export default async function UpcomingEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) redirect('/?auth=login');

  // Haal alle events op voor de user
  type ServerEvent = Omit<Event, 'messages'> & { messages?: unknown[] };

const allEventsRaw: ServerEvent[] = await getEventsForUser(currentUser.id);

const allEvents: Event[] = await Promise.all(
  allEventsRaw.map(async (ev: ServerEvent) => {
    const messages: EventMessage[] = await Promise.all(
      (ev.messages ?? []).map(async (msg: any) => ({
        id: msg.id,
        senderId: msg.senderId ?? 'unknown',
        content: msg.content ?? '',
        timestamp: (await tsToIso(msg.timestamp)) ?? new Date().toISOString(),
      }))
    );

    return {
      ...ev,
      messages,
      startDateTime: (await tsToIso(ev.startDateTime)) ?? new Date().toISOString(),
      endDateTime: (await tsToIso(ev.endDateTime)) ?? new Date().toISOString(),
      createdAt: (await tsToIso(ev.createdAt)) ?? new Date().toISOString(),
      updatedAt: (await tsToIso(ev.updatedAt)) ?? new Date().toISOString(),
      participants: ev.participants ?? {},
    };
  })
);


  // Filter enkel de aankomende events (upcoming)
  const now = DateTime.now();
  const upcomingEvents: Event[] = allEvents.filter(
    (event) => DateTime.fromISO(event.startDateTime) >= now
  );

  // Sorteer op datum
  upcomingEvents.sort(
    (a, b) =>
      DateTime.fromISO(a.startDateTime).toMillis() -
      DateTime.fromISO(b.startDateTime).toMillis()
  );

  return (
    <div className="container py-8">
      <Suspense fallback={<EventListSkeleton />}>
        <UpcomingEventsClientPage
          initialEvents={upcomingEvents}
          userId={currentUser.id}
        />
      </Suspense>
    </div>
  );
}

const EventListSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-48 w-full" />
    ))}
  </div>
);
