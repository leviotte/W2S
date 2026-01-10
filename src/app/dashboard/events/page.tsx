// src/app/dashboard/events/page.tsx
import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session.server';
import { getEventsForUser } from '@/lib/server/actions/events';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import EventsListSection from './_components/events-list-section';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuthenticatedSessionUser } from '@/types/session';
import type { Event, EventMessage } from '@/types/event';
import { tsToIso } from '@/lib/client/tsToIso';

export const metadata = {
  title: 'Mijn Evenementen - Wish2Share',
  description: 'Beheer je aankomende en afgelopen evenementen',
};

// ServerEvent type
type ServerEvent = Omit<Event, 'messages'> & { messages?: unknown[] };

export default async function EventsPage() {
  const session = await getSession();
  if (!session.user?.isLoggedIn) redirect('/?auth=login');

  const currentUser = session.user as AuthenticatedSessionUser;
  const allEventsRaw: ServerEvent[] = await getEventsForUser(currentUser.id);

  // Map ServerEvent → Event
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

  const now = new Date();

  // Helper: date string of Date → UTC timestamp
  const toUTCTimestamp = (date: string | Date) => {
    const d = new Date(date);
    return Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    );
  };

  const nowUTC = toUTCTimestamp(now);

  // ✅ Strict types in filter & sort
  const upcomingEvents: Event[] = allEvents
    .filter((event: Event) => toUTCTimestamp(event.startDateTime) >= nowUTC)
    .sort((a: Event, b: Event) => toUTCTimestamp(a.startDateTime) - toUTCTimestamp(b.startDateTime));

  const pastEvents: Event[] = allEvents
    .filter((event: Event) => toUTCTimestamp(event.startDateTime) < nowUTC)
    .sort((a: Event, b: Event) => toUTCTimestamp(b.startDateTime) - toUTCTimestamp(a.startDateTime));

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* AANKOMENDE EVENEMENTEN */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-warm-olive">
                Aankomende evenementen
              </h1>
              <p className="text-gray-600 mt-1">
                {upcomingEvents.length}{' '}
                {upcomingEvents.length === 1 ? 'evenement' : 'evenementen'}
              </p>
            </div>

            <Button
              asChild
              className="bg-warm-olive hover:bg-cool-olive text-white shadow-md hover:shadow-lg transition-all rounded-md px-4 py-2"
            >
              <Link
                href="/dashboard/events/create"
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nieuw Evenement
              </Link>
            </Button>
          </div>

          <Suspense fallback={<EventsGridSkeleton />}>
            <EventsListSection
              events={upcomingEvents}
              userId={currentUser.id}
              emptyMessage="Je hebt nog geen aankomende evenementen. Klik op 'Nieuw Evenement' om er een aan te maken!"
            />
          </Suspense>
        </div>

        {/* AFGELOPEN EVENEMENTEN */}
        {pastEvents.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-warm-olive">
                Afgelopen evenementen
              </h2>
              <p className="text-gray-600 mt-1">
                {pastEvents.length}{' '}
                {pastEvents.length === 1 ? 'evenement' : 'evenementen'}
              </p>
            </div>

            <Suspense fallback={<EventsGridSkeleton />}>
              <EventsListSection
                events={pastEvents}
                userId={currentUser.id}
                emptyMessage="Geen afgelopen evenementen."
                isPast
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton component
const EventsGridSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i: number) => (
      <Skeleton key={i} className="h-96 w-full rounded-lg bg-white" />
    ))}
  </div>
);
