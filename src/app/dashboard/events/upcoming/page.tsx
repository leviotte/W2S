// src/app/dashboard/events/upcoming/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import UpcomingEventsClientPage from './_components/upcoming-events-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserEventsAction } from '@/lib/server/actions/events';
import { Event } from '@/types/event';

export default async function UpcomingEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) redirect('/?auth=login');

  const result = await getUserEventsAction({ userId: currentUser.id, filter: 'upcoming' });
  const upcomingEvents: Event[] = result?.success ? result.data ?? [] : [];

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
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);
