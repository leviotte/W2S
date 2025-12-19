// src/app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { getEventCountsAction } from '@/lib/server/actions/events';
import { getWishlistStatsForUser } from '@/lib/server/actions/wishlist';
import { getFollowCountsAction, getFollowersAction, getFollowingAction } from '@/lib/server/actions/follow-actions';
import DashEventCards from '@/components/dashboard/dash-event-cards';
import FollowersFollowingCards from '@/components/followers/followers-following-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | Wish2Share',
  description: 'Jouw persoonlijk dashboard',
};

// ✅ FIX: searchParams is nu een Promise
interface Props {
  searchParams: Promise<{ tab?: string; subTab?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/?auth=login');
  }

  // ✅ FIX: Await searchParams!
  const { tab, subTab } = await searchParams;

  // TODO: Implementeer activeProfile logic (uit cookies of session)
  // Voor nu gebruiken we gewoon de main account
  const activeProfileId = 'main-account';
  const isProfile = activeProfileId !== 'main-account';
  const userId = isProfile ? activeProfileId : user.id;
  const profileName = isProfile ? 'Profile' : user.firstName || user.displayName;

  // ========================================================================
  // FOLLOWERS TAB
  // ========================================================================
  if (tab === 'user' && subTab === 'followers') {
    const result = await getFollowersAction(userId);
    
    if (!result.success) {
      return <div className="container p-4">Error: {result.error}</div>;
    }

    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Volgers</CardTitle>
          </CardHeader>
          <CardContent>
            {result.data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Geen followers gevonden.
              </p>
            ) : (
              <div className="space-y-3">
                {result.data.map((item) => (
                  <Link
                    key={item.id}
                    href={`/profile/${item.username || item.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <UserAvatar
                      photoURL={item.photoURL}
                      name={item.displayName}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.displayName}</p>
                      {item.address?.city && (
                        <p className="text-sm text-muted-foreground">
                          {item.address.city}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // FOLLOWING TAB
  // ========================================================================
  if (tab === 'user' && subTab === 'following') {
    const result = await getFollowingAction(userId);
    
    if (!result.success) {
      return <div className="container p-4">Error: {result.error}</div>;
    }

    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Volgend</CardTitle>
          </CardHeader>
          <CardContent>
            {result.data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Niet volgend gevonden.
              </p>
            ) : (
              <div className="space-y-3">
                {result.data.map((item) => (
                  <Link
                    key={item.id}
                    href={`/profile/${item.username || item.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <UserAvatar
                      photoURL={item.photoURL}
                      name={item.displayName}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.displayName}</p>
                      {item.address?.city && (
                        <p className="text-sm text-muted-foreground">
                          {item.address.city}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // DEFAULT DASHBOARD (EXACT ALS OUDE VERSIE!)
  // ========================================================================
  const [eventStats, wishlistStats, followCounts] = await Promise.all([
    getEventCountsAction(userId),
    getWishlistStatsForUser(userId, isProfile),
    getFollowCountsAction(userId),
  ]);

  const followStats = followCounts.success
    ? {
        followers: followCounts.data.followersCount,
        following: followCounts.data.followingCount,
      }
    : { followers: 0, following: 0 };

  return (
    <main className="p-2 sm:p-4">
      {/* ✅ EXACT zoals oude DashboardInfo.tsx */}
      <h1 className="text-2xl font-bold text-accent my-2">
        {profileName}'s Dashboard
      </h1>

      <DashEventCards
        events={eventStats}
        wishlists={wishlistStats}
      />

      <FollowersFollowingCards
        followersCount={followStats.followers}
        followingCount={followStats.following}
      />
    </main>
  );
}