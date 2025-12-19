// src/app/dashboard/upcoming/page.tsx
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/actions';
import { getEventsForUser } from '@/lib/server/data/events';
import { redirect } from 'next/navigation';
import UpcomingEventsClientPage from './_components/upcoming-events-client-page';
import { Skeleton } from '@/components/ui/skeleton';

export default async function UpcomingEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/?auth=login');
  }

  // ✅ GEFIXED - pass userId correctly
  const allEvents = await getEventsForUser(currentUser.id);

  console.log(`✅ Loaded ${allEvents.length} events for user ${currentUser.id}`);

  return (
    <div className="container py-8">
      <Suspense fallback={<EventListSkeleton />}>
        <UpcomingEventsClientPage
          initialEvents={allEvents}
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