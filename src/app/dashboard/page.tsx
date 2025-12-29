// src/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { getUserEventsAction } from '@/lib/server/actions/events';
import { getWishlistStatsForUser } from '@/lib/server/data/user-stats';
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

interface Props {
  searchParams: Promise<{ tab?: string; subTab?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/?auth=login');
  }

  const { tab, subTab } = await searchParams;

  // ✅ cookies() is async
  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get("activeProfile")?.value || "main-account";

  const isProfile = activeProfileId !== 'main-account';
  const userId = isProfile ? activeProfileId : user.id;
  const profileName = isProfile ? 'Profile' : user.firstName || user.displayName;

  // -----------------------------------------------------------------------
  // Followers tab
  // -----------------------------------------------------------------------
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
                        <p className="text-sm text-muted-foreground">{item.address.city}</p>
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

  // -----------------------------------------------------------------------
  // Following tab
  // -----------------------------------------------------------------------
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
                Je volgt nog niemand. Zoek vrienden in de searchpage en volg ze om op de hoogte te blijven van hun wishlists!
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
                        <p className="text-sm text-muted-foreground">{item.address.city}</p>
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

  // -----------------------------------------------------------------------
  // Default dashboard
  // -----------------------------------------------------------------------
  const [eventStats, wishlistStats, followCounts] = await Promise.all([
    getUserEventsAction(userId),
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
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-accent my-2">
        {profileName}'s Dashboard
      </h1>

      <DashEventCards events={eventStats} wishlists={wishlistStats} />

      <FollowersFollowingCards
        followersCount={followStats.followers}
        followingCount={followStats.following}
      />
    </div>
  );
}
