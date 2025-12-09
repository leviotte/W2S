// src/components/dashboard/dashboard-client-wrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { setupRealtimeListener } from "@/lib/utils/followActions";
import { getOrganizedEventCount } from "@/lib/utils/eventUpdates";
import DashEventCards, { type EventStats } from "@/components/dashboard/dash-event-cards";
import FollowersFollowingCards, { type FollowStats } from "@/components/followers/followers-following-cards";
import type { WishlistStats } from "@/lib/data/wishlists";

interface DashboardClientWrapperProps {
  userId: string;
  isProfile: boolean;
  initialFollows: FollowStats;
  initialEvents: EventStats;
  initialWishlists: WishlistStats;
}

export default function DashboardClientWrapper({
  userId,
  isProfile,
  initialFollows,
  initialEvents,
  initialWishlists,
}: DashboardClientWrapperProps) {
  const [followStats, setFollowStats] = useState<FollowStats>(initialFollows);
  const [eventStats, setEventStats] = useState<EventStats>(initialEvents);
  
  useEffect(() => {
    // DE FIX: De callback geeft de *volledige nieuwe staat* terug, dus we hoeven niet te mergen met 'prevStats'.
    const unsubscribeEvents = getOrganizedEventCount(userId, (newCounts) => {
        setEventStats(newCounts);
    });

    const unsubscribeFollowers = setupRealtimeListener(userId, isProfile, "followers", (data) =>
      setFollowStats((prev) => ({ ...prev, followers: data.length }))
    );

    const unsubscribeFollowing = setupRealtimeListener(userId, isProfile, "following", (data) =>
      setFollowStats((prev) => ({ ...prev, following: data.length }))
    );

    return () => {
      unsubscribeEvents();
      unsubscribeFollowers?.();
      unsubscribeFollowing?.();
    };
  }, [userId, isProfile]);

  return (
    <>
      <DashEventCards
        organizedEvents={eventStats}
        wishlists={initialWishlists}
      />
      <FollowersFollowingCards
        followersCount={followStats.followers}
        followingCount={followStats.following}
      />
    </>
  );
}