// app/dashboard/info/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashEventCards from "@/components/DashEventCards";
import FollowersFollowingCards from "@/components/FollowersFollowingCards";
import { useStore } from "@/store/useStore";
import { setupRealtimeListener } from "@/utils/followActions";
import { getOrganizedEventCount } from "@/utils/eventUpdates";

export default function DashboardInfo() {
  const { currentUser, wishlists, loadWishlists } = useStore();

  const activeProfileId = typeof window !== "undefined" ? localStorage.getItem("activeProfile") : null;
  const isProfile = activeProfileId !== "main-account";
  const userId = isProfile ? activeProfileId : currentUser?.id;
  const profileName = isProfile ? currentUser?.name : currentUser?.firstName;

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [wishlistStats, setWishlistStats] = useState({
    total: 0,
    public: 0,
    private: 0,
  });
  const [organizedEventsCount, setOrganizedEventsCount] = useState<{
    onGoing: number;
    all: number;
  }>({ onGoing: 0, all: 0 });

  // Load wishlists when user is ready
  useEffect(() => {
    if (currentUser) loadWishlists();
  }, [currentUser, loadWishlists]);

  // Update wishlist stats whenever wishlists change
  useEffect(() => {
    if (wishlists && wishlists.length > 0) {
      const publicWishlists = wishlists.filter(wl => !wl.isPrivate);
      const privateWishlists = wishlists.filter(wl => wl.isPrivate);

      setWishlistStats({
        total: wishlists.length,
        public: publicWishlists.length,
        private: privateWishlists.length,
      });
    } else {
      setWishlistStats({ total: 0, public: 0, private: 0 });
    }
  }, [wishlists]);

  // Setup realtime listeners for followers/following and organized events
  useEffect(() => {
    if (!userId) return;

    const unsubscribeFollowers = setupRealtimeListener(
      userId,
      isProfile,
      "followers",
      data => setFollowersCount(data.length)
    );

    const unsubscribeFollowing = setupRealtimeListener(
      userId,
      isProfile,
      "following",
      data => setFollowingCount(data.length)
    );

    getOrganizedEventCount(userId, isProfile, data => setOrganizedEventsCount(data));

    return () => {
      unsubscribeFollowers?.();
      unsubscribeFollowing?.();
    };
  }, [userId, isProfile]);

  return (
    <main className="p-2 sm:p-4">
      <h1 className="text-2xl font-bold text-accent my-2">
        {profileName}'s Dashboard
      </h1>

      <DashEventCards
        organizedEvents={organizedEventsCount}
        wishlists={wishlistStats}
      />

      <FollowersFollowingCards
        followersCount={followersCount}
        followingCount={followingCount}
      />
    </main>
  );
}
