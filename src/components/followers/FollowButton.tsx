'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { followUserAction, unfollowUserAction, isFollowingAction } from '@/lib/server/actions/follow-actions';
import { toast } from 'sonner';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  currentUserId: string;
  targetId: string;
}

export default function FollowButton({ currentUserId, targetId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFollowStatus() {
      try {
        const result = await isFollowingAction(currentUserId, targetId);
        if (result.success) {
          setIsFollowing(result.data);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setLoading(false);
      }
    }
    checkFollowStatus();
  }, [currentUserId, targetId]);

  const handleToggleFollow = async () => {
    setLoading(true);
    try {
      const result = isFollowing
        ? await unfollowUserAction(currentUserId, targetId)
        : await followUserAction(currentUserId, targetId);

      if (result.success) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? 'Niet meer gevolgd' : 'Aan het volgen!');
      } else {
        toast.error(result.error || 'Er is iets misgegaan');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Laden...
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggleFollow}
      variant={isFollowing ? 'outline' : 'default'}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Ontvolgeen
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Volgen
        </>
      )}
    </Button>
  );
}