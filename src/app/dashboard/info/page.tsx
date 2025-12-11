import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/actions';
import { getFollowCounts } from '@/lib/server/data/users';
import { getEventCountsForUser } from '@/lib/server/data/events'; // Nieuwe server-functie
import { getWishlistStatsForUser } from '@/lib/server/data/wishlists'; // Nieuwe server-functie
import DashboardClientWrapper from '@/components/dashboard/dashboard-client-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EventStats } from '@/components/dashboard/dash-event-cards';

// Dit is een ASYNCHRONE Server Component!
export default async function DashboardInfoPage() {
  // 1. Haal de gebruiker op de server op.
  const user = await getCurrentUser();
  if (!user) {
    // In een echte app zou je hier redirecten. Voor nu is een error prima.
    // redirect('/login'); 
    throw new Error('Not authenticated');
  }

  // OPMERKING: Logica voor subprofielen komt later. We focussen op de hoofdgebruiker.
  const userId = user.id;

  // 2. Haal ALLE initiële data parallel op.
  const [initialFollows, rawEventCounts, initialWishlists] = await Promise.all([
    getFollowCounts(userId),
    getEventCountsForUser(userId),
    getWishlistStatsForUser(userId),
  ]);

  // 3. [DE FIX] Transformeer de ruwe data naar de structuur die de client verwacht.
  const initialEvents: EventStats = {
    upcoming: rawEventCounts.upcoming,
    past: rawEventCounts.past,
    // Placeholder voor 'ongoing'. Als dit relevant is, kunnen we de query later uitbreiden.
    onGoing: 0, 
    // Afgeleide waarde: 'all' is de som van de anderen.
    all: rawEventCounts.upcoming + rawEventCounts.past,
  };

  return (
    <main className="p-2 sm:p-4">
      <h1 className="text-2xl font-bold text-accent my-2">
        {user.firstName}'s Dashboard
      </h1>

      {/* 
        4. De Client Wrapper ontvangt nu de correcte 'initialEvents' prop.
           De Suspense is een 'gold standard' best practice.
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClientWrapper
          userId={userId}
          isProfile={false} // Vereenvoudigd voor nu
          initialFollows={initialFollows}
          initialEvents={initialEvents} // <-- ✅ Type komt nu overeen!
          initialWishlists={initialWishlists}
        />
      </Suspense>
    </main>
  );
}

// Een Skeleton loader is een uitstekende UX-verbetering. Behoud dit zeker.
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}