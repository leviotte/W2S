import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/actions';
import { getFollowCounts } from '@/lib/server/data/users';
import { getEventCountsForUser } from '@/lib/server/data/events'; // Nieuwe server-functie
import { getWishlistStatsForUser } from '@/lib/server/data/wishlists'; // Nieuwe server-functie
import DashboardClientWrapper from '@/components/dashboard/dashboard-client-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Dit is nu een ASYNCHRONE Server Component!
export default async function DashboardInfoPage() {
  // 1. Haal de gebruiker op de server op. Redirect als hij niet is ingelogd.
  const user = await getCurrentUser();
  if (!user) {
    // In een echte app zou je hier redirecten, maar voor nu is een error prima.
    throw new Error('Not authenticated');
  }

  // OPMERKING: We moeten hier nog de logica voor actieve subprofielen implementeren.
  // Voor nu focussen we op de hoofdgebruiker om de dataflow te fixen.
  const userId = user.id;

  // 2. Haal ALLE initiële data parallel op met Promise.all
  const [initialFollows, initialEvents, initialWishlists] = await Promise.all([
    getFollowCounts(userId),
    getEventCountsForUser(userId),
    getWishlistStatsForUser(userId),
  ]);

  return (
    <main className="p-2 sm:p-4">
      <h1 className="text-2xl font-bold text-accent my-2">
        {user.firstName}'s Dashboard
      </h1>

      {/* 
        3. De Client Wrapper ontvangt alle initiële data als props.
           Hij zorgt voor de weergave en start de realtime listeners.
           De Suspense is een best practice voor als de data-fetching traag is.
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClientWrapper
          userId={userId}
          isProfile={false} // Vereenvoudigd voor nu
          initialFollows={initialFollows}
          initialEvents={initialEvents}
          initialWishlists={initialWishlists}
        />
      </Suspense>
    </main>
  );
}

// Een Skeleton loader is een 'gold standard' UX-verbetering.
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