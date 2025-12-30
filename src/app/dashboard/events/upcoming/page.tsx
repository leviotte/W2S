// src/app/dashboard/events/upcoming/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import UpcomingEventsClientPage from './_components/upcoming-events-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { getEventsForUser } from '@/lib/server/actions/events';
import type { Event } from '@/types/event';
import { DateTime } from 'luxon';

export default async function UpcomingEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) redirect('/?auth=login');

  // Haal alle events op voor de user
  const allEvents: Event[] = await getEventsForUser(currentUser.id);

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
