// src/app/dashboard/info/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { DashboardClientWrapper } from '@/components/dashboard/dashboard-client-wrapper';
import type { EventStats, WishlistStats } from '@/components/dashboard/dash-event-cards';

async function getEventCounts(userId: string): Promise<EventStats> {
  try {
    const eventsRef = adminDb.collection('events');
    const now = new Date();

    // Get all events for user
    const allEventsSnapshot = await eventsRef
      .where(`participants.${userId}.id`, '==', userId)
      .get();

    const allEvents = allEventsSnapshot.docs;

    // Count upcoming events
    const upcomingEvents = allEvents.filter(doc => {
      const date = doc.data().date?.toDate?.() || new Date(doc.data().date);
      return date >= now;
    });

    // Count past events
    const pastEvents = allEvents.filter(doc => {
      const date = doc.data().date?.toDate?.() || new Date(doc.data().date);
      return date < now;
    });

    return {
      upcoming: upcomingEvents.length,
      past: pastEvents.length,
      onGoing: 0, // ✅ Added for EventStats compatibility
      all: allEvents.length,
    };
  } catch (error) {
    console.error('Error fetching event counts:', error);
    return { upcoming: 0, past: 0, onGoing: 0, all: 0 };
  }
}

async function getWishlistStats(userId: string): Promise<WishlistStats> {
  try {
    const wishlistsRef = adminDb.collection('wishlists');
    const snapshot = await wishlistsRef
      .where('ownerId', '==', userId)
      .get();

    const wishlists = snapshot.docs;
    const publicCount = wishlists.filter(doc => doc.data().isPublic === true).length;

    return {
      total: wishlists.length,
      public: publicCount,
      private: wishlists.length - publicCount,
    };
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    return { total: 0, public: 0, private: 0 };
  }
}

async function getFollowStats(userId: string) {
  try {
    // Get followers count
    const followersSnapshot = await adminDb
      .collection('follows')
      .where('followingId', '==', userId)
      .get();

    // Get following count
    const followingSnapshot = await adminDb
      .collection('follows')
      .where('followerId', '==', userId)
      .get();

    return {
      followers: followersSnapshot.size, // ✅ FIX: Return NUMBER not array
      following: followingSnapshot.size, // ✅ FIX: Return NUMBER not array
    };
  } catch (error) {
    console.error('Error fetching follow stats:', error);
    return { followers: 0, following: 0 };
  }
}

export default async function DashboardInfoPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?modal=login&callbackUrl=/dashboard/info');
  }

  const [eventCounts, wishlistCounts, followStats] = await Promise.all([
    getEventCounts(currentUser.id),
    getWishlistStats(currentUser.id),
    getFollowStats(currentUser.id),
  ]);

  return (
    <DashboardClientWrapper
      initialEvents={eventCounts}
      initialWishlists={wishlistCounts}
      initialFollows={followStats}
    />
  );
}