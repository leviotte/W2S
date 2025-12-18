// src/components/shared/follow-button.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  followUserOrProfileAction,
  unfollowUserOrProfileAction,
} from '@/lib/server/actions/follow-actions';
import { setupRealtimeListener } from '@/hooks/use-follow';

interface FollowButtonProps {
  currentUserId: string;
  targetId: string;
  isTargetProfile: boolean;
  isCurrentUserProfile: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function FollowButton({
  currentUserId,
  targetId,
  isTargetProfile,
  isCurrentUserProfile,
  variant = 'default',
  size = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = setupRealtimeListener(
      currentUserId,
      isCurrentUserProfile,
      'following',
      (followings) => {
        const followingUserIds = followings.map((f) => f.id);
        setIsFollowing(followingUserIds.includes(targetId));
      }
    );
    return () => unsubscribe();
  }, [currentUserId, targetId, isCurrentUserProfile]);

  const handleFollow = () => {
    startTransition(async () => {
      try {
        if (isFollowing) {
          const result = await unfollowUserOrProfileAction(
            currentUserId,
            targetId,
            isTargetProfile,
            isCurrentUserProfile
          );
          
          if (!result.success) {
            toast.error('Fout', { description: result.error });
          } else {
            toast.success('Niet meer gevolgd');
          }
        } else {
          const result = await followUserOrProfileAction(
            currentUserId,
            targetId,
            isTargetProfile,
            isCurrentUserProfile
          );
          
          if (!result.success) {
            toast.error('Fout', { description: result.error });
          } else {
            toast.success('Nu volgend!');
          }
        }
      } catch (error) {
        console.error('Error updating follow status:', error);
        toast.error('Er ging iets mis');
      }
    });
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isPending}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={
        isFollowing
          ? 'bg-[#b34c4c] text-white hover:bg-[#b34c4c]/80 border-[#b34c4c]'
          : 'bg-warm-olive hover:bg-cool-olive'
      }
    >
      {isPending ? 'Laden...' : isFollowing ? 'Ontvolgen' : 'Volgen'}
    </Button>
  );
}