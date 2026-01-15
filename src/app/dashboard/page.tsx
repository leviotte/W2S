// src/app/dashboard/page.tsx
import 'server-only';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { getDashboardStats } from '@/lib/server/data/dashboard-stats';
import {
  getFollowersAction,
  getFollowingAction,
} from '@/lib/server/actions/follow-actions';
import { getActiveProfileId } from '@/lib/auth/active-profile';

import DashEventCards from '@/components/dashboard/dash-event-cards';
import FollowersFollowingCards from '@/components/followers/followers-following-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared/user-avatar';

/* ============================================================================
 * NEXT.JS CONFIG (ISR)
 * ========================================================================== */
export const revalidate = 60;

/* ============================================================================
 * METADATA
 * ========================================================================== */
export const metadata = {
  title: 'Dashboard | Wish2Share',
  description: 'Jouw persoonlijk dashboard',
};

/* ============================================================================
 * PAGE
 * ========================================================================== */
export default async function DashboardPage({ searchParams }: { searchParams?: { tab?: 'user'; subTab?: 'followers' | 'following' } }) {
  // ------------------------------
  // GET SERVER SESSION (NextAuth)
  // ------------------------------
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/?auth=login');
  }

  const user = session!.user;

  // ------------------------------
  // PROFILE CONTEXT
  // ------------------------------
  const activeProfileId = await getActiveProfileId();
  const isProfile = activeProfileId !== 'main-account';
  const profileId = isProfile ? activeProfileId : user.id;
  const profileName = isProfile ? 'Profile' : user.name || user.email;

  // ------------------------------
  // ROUTE PARAMS
  // ------------------------------
  const tab = searchParams?.tab;
  const subTab = searchParams?.subTab;

  // ============================================================================
  // FOLLOWERS TAB
  // ============================================================================
  if (tab === 'user' && subTab === 'followers') {
    const result = await getFollowersAction(profileId);

    if (!result.success) {
      return (
        <div className="container max-w-2xl mx-auto p-4">
          <p className="text-destructive">Error: {result.error}</p>
        </div>
      );
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
                {result.data.map(u => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username || u.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <UserAvatar photoURL={u.photoURL} name={u.displayName} className="h-12 w-12" />
                    <div className="flex-1">
                      <p className="font-medium">{u.displayName}</p>
                      {u.address?.city && (
                        <p className="text-sm text-muted-foreground">{u.address.city}</p>
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

  // ============================================================================
  // FOLLOWING TAB
  // ============================================================================
  if (tab === 'user' && subTab === 'following') {
    const result = await getFollowingAction(profileId);

    if (!result.success) {
      return (
        <div className="container max-w-2xl mx-auto p-4">
          <p className="text-destructive">Error: {result.error}</p>
        </div>
      );
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
                Je volgt nog niemand. Zoek vrienden en volg ze om op de hoogte te blijven van hun wishlists!
              </p>
            ) : (
              <div className="space-y-3">
                {result.data.map(u => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username || u.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <UserAvatar photoURL={u.photoURL} name={u.displayName} className="h-12 w-12" />
                    <div className="flex-1">
                      <p className="font-medium">{u.displayName}</p>
                      {u.address?.city && (
                        <p className="text-sm text-muted-foreground">{u.address.city}</p>
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

  // ============================================================================
  // DEFAULT DASHBOARD
  // ============================================================================
  const { events, wishlists, follows } = await getDashboardStats(profileId);

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-accent my-2">{profileName}&apos;s Dashboard</h1>

      <DashEventCards events={events} wishlists={wishlists} />

      <FollowersFollowingCards
        followersCount={follows.followers}
        followingCount={follows.following}
      />
    </div>
  );
}
