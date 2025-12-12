import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getEventCountsAction } from '@/lib/server/actions/event-actions';
import { getFollowStatsAction } from '@/lib/server/actions/follow-actions';
import { getUserWishlistsAction } from '@/lib/server/actions/wishlist-actions';
import DashboardClientWrapper from '@/components/dashboard/dashboard-client-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardInfoPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/');
  }

  const userId = session.user.id;

  // ✅ Parallel data fetching
  const [rawEventCounts, rawFollowStats, wishlistsResult] = await Promise.all([
    getEventCountsAction(userId),
    getFollowStatsAction(userId),
    getUserWishlistsAction(userId),
  ]);

  // ✅ FIXED: Correct EventStats structure (upcoming instead of onGoing)
  const eventCounts = {
    upcoming: rawEventCounts.upcoming || 0,
    past: rawEventCounts.past || 0,
    all: (rawEventCounts.upcoming || 0) + (rawEventCounts.past || 0),
  };

  // ✅ FIXED: Correct FollowStats structure
  const initialFollows = {
    followers: rawFollowStats.followers || [],
    following: rawFollowStats.following || [],
    followersCount: rawFollowStats.followersCount || 0,
    followingCount: rawFollowStats.followingCount || 0,
  };

  // ✅ FIXED: Correct WishlistStats structure
  const wishlists = wishlistsResult.success ? wishlistsResult.data : [];
  const initialWishlists = {
    total: wishlists.length,
    public: wishlists.filter((w) => w.isPublic).length,
    private: wishlists.filter((w) => !w.isPublic).length,
    totalItems: wishlists.reduce((sum, w) => sum + w.items.length, 0),
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClientWrapper
        user={session.user}
        initialEvents={eventCounts}
        initialFollows={initialFollows}
        initialWishlists={initialWishlists}
      />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}