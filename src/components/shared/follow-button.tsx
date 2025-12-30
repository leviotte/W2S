// src/components/shared/follow-button.tsx
'use client';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { followUserOrProfileAction, unfollowUserOrProfileAction } from '@/lib/server/actions/follow-actions';
import { setupRealtimeListener } from '@/hooks/use-follow';

interface Props {
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
}: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = setupRealtimeListener(currentUserId, isCurrentUserProfile, 'following', (followings) => {
      setIsFollowing(followings.map(f => f.id).includes(targetId));
    });
    return () => unsubscribe();
  }, [currentUserId, targetId, isCurrentUserProfile]);

  const handleFollow = () => {
    startTransition(async () => {
      try {
        if (isFollowing) {
          const res = await unfollowUserOrProfileAction(currentUserId, targetId, isTargetProfile, isCurrentUserProfile);
          if (!res.success) toast.error('Fout', { description: res.error });
          else toast.success('Niet meer gevolgd');
        } else {
          const res = await followUserOrProfileAction(currentUserId, targetId, isTargetProfile, isCurrentUserProfile);
          if (!res.success) toast.error('Fout', { description: res.error });
          else toast.success('Nu volgend!');
        }
      } catch (error) {
        console.error('Follow error:', error);
        toast.error('Er ging iets mis');
      }
    });
  };

  if (isCurrentUserProfile) return null;

  return (
    <Button
      onClick={handleFollow}
      disabled={isPending}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={isFollowing ? 'bg-[#b34c4c] text-white hover:bg-[#b34c4c]/80 border-[#b34c4c]' : 'bg-warm-olive hover:bg-cool-olive'}
    >
      {isPending ? 'Laden...' : isFollowing ? 'Ontvolgen' : 'Volgen'}
    </Button>
  );
}
