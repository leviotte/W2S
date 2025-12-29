// src/app/dashboard/events/page.tsx
import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { getEventsForUser } from '@/lib/server/data/events';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import EventsListSection from './_components/events-list-section';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuthenticatedSessionUser } from '@/types/session';

export const metadata = {
  title: 'Mijn Evenementen - Wish2Share',
  description: 'Beheer je aankomende en afgelopen evenementen',
};

export default async function EventsPage() {
  const session = await getSession();

  // Altijd eerst discrimineren!
  if (!session.user.isLoggedIn) {
    redirect('/?auth=login');
  }
  const currentUser = session.user as AuthenticatedSessionUser;

  const allEvents = await getEventsForUser(currentUser.id);

  console.log('🔵 Total events fetched:', allEvents.length);
  console.log(
    '🔵 Events:',
    allEvents.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      organizerId: e.organizerId,
      participantsCount: Object.keys(e.participants || {}).length,
    }))
  );

  const now = new Date();

  // ✅ Helper om een date string of Date object naar UTC timestamp te converteren
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

  const upcomingEvents = allEvents
    .filter((event) => toUTCTimestamp(event.date) >= nowUTC)
    .sort((a, b) => toUTCTimestamp(a.date) - toUTCTimestamp(b.date));

  const pastEvents = allEvents
    .filter((event) => toUTCTimestamp(event.date) < nowUTC)
    .sort((a, b) => toUTCTimestamp(b.date) - toUTCTimestamp(a.date));

  console.log('🔵 Split events:', {
    upcoming: upcomingEvents.length,
    past: pastEvents.length,
  });

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

const EventsGridSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-96 w-full rounded-lg bg-white" />
    ))}
  </div>
);
