// app/components/FollowersFollowingCount.tsx
"use client";

import { useEffect, useState } from "react";
import { setupRealtimeListener } from "@/utils/followActions";

interface FollowersFollowingCountProps {
  userId: string;
  isTargetProfile: boolean;
}

export default function FollowersFollowingCount({
  userId,
  isTargetProfile,
}: FollowersFollowingCountProps) {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    // Realtime listener voor followers
    const unsubscribeFollowers = setupRealtimeListener(
      userId,
      isTargetProfile,
      "followers",
      (followers) => setFollowersCount(followers.length)
    );

    // Realtime listener voor following
    const unsubscribeFollowing = setupRealtimeListener(
      userId,
      isTargetProfile,
      "following",
      (following) => setFollowingCount(following.length)
    );

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [userId, isTargetProfile]);

  return (
    <div className="flex flex-col space-y-2 mt-4">
      <div>
        <span className="font-semibold">Followers:</span> {followersCount}
      </div>
      <div>
        <span className="font-semibold">Following:</span> {followingCount}
      </div>
    </div>
  );
}
