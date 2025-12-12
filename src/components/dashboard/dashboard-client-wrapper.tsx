'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { useAuthStore } from '@/lib/store/use-auth-store';
import DashEventCards from './dash-event-cards';
import FollowersFollowingCards from '../followers/followers-following-cards';
import type { EventStats, WishlistStats } from './dash-event-cards';

export type FollowStats = {
  followers: number;
  following: number;
};

interface DashboardClientWrapperProps {
  initialEvents: EventStats;
  initialWishlists: WishlistStats;
  initialFollows: FollowStats;
}

export function DashboardClientWrapper({
  initialEvents,
  initialWishlists,
  initialFollows,
}: DashboardClientWrapperProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [eventStats, setEventStats] = useState<EventStats>(initialEvents);
  const [wishlistStats, setWishlistStats] = useState<WishlistStats>(initialWishlists);
  const [followStats, setFollowStats] = useState<FollowStats>(initialFollows);

  useEffect(() => {
    if (!currentUser?.id) return;

    const eventsQuery = query(
      collection(db, 'events'),
      where(`participants.${currentUser.id}.id`, '==', currentUser.id)
    );

    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const now = new Date();
      const events = snapshot.docs;

      const upcoming = events.filter(doc => {
        const date = doc.data().date?.toDate?.() || new Date(doc.data().date);
        return date >= now;
      }).length;

      const past = events.filter(doc => {
        const date = doc.data().date?.toDate?.() || new Date(doc.data().date);
        return date < now;
      }).length;

      setEventStats({
        upcoming,
        past,
        onGoing: 0,
        all: events.length,
      });
    });

    const wishlistsQuery = query(
      collection(db, 'wishlists'),
      where('ownerId', '==', currentUser.id)
    );

    const unsubWishlists = onSnapshot(wishlistsQuery, (snapshot) => {
      const wishlists = snapshot.docs;
      const publicCount = wishlists.filter(doc => doc.data().isPublic === true).length;

      setWishlistStats({
        total: wishlists.length,
        public: publicCount,
        private: wishlists.length - publicCount,
      });
    });

    return () => {
      unsubEvents();
      unsubWishlists();
    };
  }, [currentUser?.id]);

  return (
    <div className="space-y-6">
      <DashEventCards 
        events={eventStats} 
        wishlists={wishlistStats} 
      />
      
      {/* ✅ FIXED: Pass individual props */}
      <FollowersFollowingCards 
        followersCount={followStats.followers}
        followingCount={followStats.following}
      />
    </div>
  );
}