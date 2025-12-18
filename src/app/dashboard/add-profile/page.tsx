// src/app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";
import { getEventStatsForUser, getWishlistStatsForUser, getFollowStatsForUser } from "@/lib/server/data/dashboard-stats";

export const metadata = {
  title: "Dashboard | Wish2Share",
  description: "Jouw persoonlijk dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth=login");
  }

  // Fetch initial stats server-side
  const [eventStats, wishlistStats, followStats] = await Promise.all([
    getEventStatsForUser(user.id),
    getWishlistStatsForUser(user.id),
    getFollowStatsForUser(user.id),
  ]);

  const profileName = user.firstName || user.displayName || "User";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent mb-2">
          {profileName}'s Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <DashboardClientWrapper
        initialEvents={eventStats}
        initialWishlists={wishlistStats}
        initialFollows={followStats}
      />
    </div>
  );
}