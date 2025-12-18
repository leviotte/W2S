// src/lib/data/dashboard-stats.ts
"use server";

import { adminDb } from "@/lib/server/firebase-admin";
import type { EventStats, WishlistStats } from "@/components/dashboard/dash-event-cards";
import type { FollowStats } from "@/components/followers/followers-following-cards";

export async function getEventStatsForUser(userId: string): Promise<EventStats> {
  try {
    const eventsSnapshot = await adminDb
      .collection("events")
      .where(`participants.${userId}.id`, "==", userId)
      .get();

    const now = new Date();
    let upcoming = 0;
    let past = 0;

    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      const eventDate = data.date?.toDate?.() || new Date(data.date);

      if (eventDate >= now) {
        upcoming++;
      } else {
        past++;
      }
    });

    return {
      upcoming,
      past,
      onGoing: 0,
      all: eventsSnapshot.size,
    };
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return { upcoming: 0, past: 0, onGoing: 0, all: 0 };
  }
}

export async function getWishlistStatsForUser(userId: string): Promise<WishlistStats> {
  try {
    const wishlistsSnapshot = await adminDb
      .collection("wishlists")
      .where("ownerId", "==", userId)
      .get();

    let publicCount = 0;

    wishlistsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublic === true) {
        publicCount++;
      }
    });

    return {
      total: wishlistsSnapshot.size,
      public: publicCount,
      private: wishlistsSnapshot.size - publicCount,
    };
  } catch (error) {
    console.error("Error fetching wishlist stats:", error);
    return { total: 0, public: 0, private: 0 };
  }
}

export async function getFollowStatsForUser(userId: string): Promise<FollowStats> {
  try {
    const [followersSnapshot, followingSnapshot] = await Promise.all([
      adminDb.collection("followers").where("followingId", "==", userId).get(),
      adminDb.collection("followers").where("followerId", "==", userId).get(),
    ]);

    return {
      followers: followersSnapshot.size,
      following: followingSnapshot.size,
    };
  } catch (error) {
    console.error("Error fetching follow stats:", error);
    return { followers: 0, following: 0 };
  }
}