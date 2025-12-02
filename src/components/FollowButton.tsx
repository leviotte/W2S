// app/components/FollowButton.tsx
"use client";

import { useEffect, useState } from "react";
import {
  followUserOrProfile,
  unfollowUserOrProfile,
  setupRealtimeListener,
} from "@/src/utils/followActions";

interface FollowButtonProps {
  currentUserId: string;
  targetId: string;
  isTargetProfile: boolean;
  isCurrentUserProfile: boolean;
}

export default function FollowButton({
  currentUserId,
  targetId,
  isTargetProfile,
  isCurrentUserProfile,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const unsubscribe = setupRealtimeListener(
      currentUserId,
      isCurrentUserProfile,
      "following",
      (followings: any[]) => {
        const followingUserIds = followings.map((f) => f.id);
        setIsFollowing(followingUserIds.includes(targetId));
      }
    );
    return () => unsubscribe();
  }, [currentUserId, targetId, isCurrentUserProfile]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUserOrProfile(
          currentUserId,
          targetId,
          isTargetProfile,
          isCurrentUserProfile
        );
      } else {
        await followUserOrProfile(
          currentUserId,
          targetId,
          isTargetProfile,
          isCurrentUserProfile
        );
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  return (
    <button
      onClick={handleFollow}
      className={`px-4 py-2 rounded-lg font-semibold transition ${
        isFollowing
          ? "bg-[#b34c4c] text-white hover:bg-[#b34c4c]/80"
          : "bg-warm-olive text-white hover:bg-cool-olive"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
