// src/hooks/use-follow.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getFollowersAction,
  getFollowingAction,
  followUserOrProfileAction,
  unfollowUserOrProfileAction,
} from '@/lib/server/actions/follow-actions';
import type { UserProfile } from '@/types/user';

export function useFollow(userId: string, isProfile: boolean) {
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const followersRes = await getFollowersAction(userId);
      const followingRes = await getFollowingAction(userId);

      setFollowers(followersRes.success ? followersRes.data : []);
      setFollowing(followingRes.success ? followingRes.data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Kon data niet ophalen');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId, fetchData]);

  const follow = useCallback(
    async (targetId: string, isTargetProfile: boolean, isCurrentUserProfile: boolean) => {
      const res = await followUserOrProfileAction(userId, targetId, isTargetProfile, isCurrentUserProfile);
      if (res.success) await fetchData();
      return res;
    },
    [userId, fetchData]
  );

  const unfollow = useCallback(
    async (targetId: string, isTargetProfile: boolean, isCurrentUserProfile: boolean) => {
      const res = await unfollowUserOrProfileAction(userId, targetId, isTargetProfile, isCurrentUserProfile);
      if (res.success) await fetchData();
      return res;
    },
    [userId, fetchData]
  );

  const isFollowing = useCallback(
    (targetId: string) => following.some((u) => u.id === targetId),
    [following]
  );

  return {
    followers,
    following,
    loading,
    error,
    follow,
    unfollow,
    isFollowing,
    refresh: fetchData,
  };
}
