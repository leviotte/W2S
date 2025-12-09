// src/app/dashboard/upcoming/page.tsx
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/actions';
import { getEventsForUser } from '@/lib/server/data/events'; // SERVER-SIDE FETCHING!
import { redirect } from 'next/navigation';
import UpcomingEventsClientPage from './_components/upcoming-events-client-page'; // NIEUW CLIENT COMPONENT
import PageTitle from '@/components/layout/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dit is nu een ASYNC SERVER COMPONENT
export default async function UpcomingEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.profile.id) {
    redirect('/?auth=login');
  }

  // 1. DATA WORDT HIER GELADEN, OP DE SERVER!
  // We halen alle events in één keer op. De client filtert ze later.
  const allEvents = await getEventsForUser(currentUser.id);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <PageTitle
          title="Mijn Evenementen"
          description="Beheer je aankomende en voorbije evenementen."
        />
        <Button asChild>
          <Link href="/dashboard/event/create">Nieuw Evenement</Link>
        </Button>
      </div>

      <Suspense fallback={<EventListSkeleton />}>
        {/* 2. WE GEVEN DE DATA ALS PROP DOOR AAN HET CLIENT COMPONENT */}
        <UpcomingEventsClientPage
          initialEvents={allEvents}
          userId={currentUser.id}
        />
      </Suspense>
    </div>
  );
}

// Een simpele skeleton loader voor een betere UX
const EventListSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);