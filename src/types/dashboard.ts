// src/types/dashboard.ts

/**
 * ✅ DASHBOARD STATISTICS TYPES
 * Gebruikt voor dashboard overview pages
 */

export type EventStats = {
  upcoming: number;
  past: number;
  onGoing: number;
  all: number;
};

export type WishlistStats = {
  total: number;
  public: number;
  private: number;
};

export type FollowStats = {
  followers: number;
  following: number;
};

export type DashboardStats = {
  events: EventStats;
  wishlists: WishlistStats;
  follows: FollowStats;
};

/**
 * ✅ DASHBOARD FILTER TYPES
 */
export type EventFilter = 'all' | 'upcoming' | 'ongoing' | 'past';
export type WishlistFilter = 'all' | 'public' | 'private';

/**
 * ✅ DASHBOARD TAB TYPES
 */
export type DashboardTab = 'events' | 'wishlists' | 'friends' | 'info';
export type EventSubTab = 'upcoming' | 'ongoing' | 'past';
export type WishlistSubTab = 'all' | 'public' | 'private';