// src/components/dashboard/dashboard-stats-view.tsx
'use client';

import { Calendar, Gift, Users, TrendingUp } from 'lucide-react';
import type { EventStats, WishlistStats, FollowStats } from '@/types/dashboard';

interface DashboardStatsViewProps {
  eventStats: EventStats;
  wishlistStats: WishlistStats;
  followStats: FollowStats;
  userName: string;
}

export default function DashboardStatsView({
  eventStats,
  wishlistStats,
  followStats,
  userName,
}: DashboardStatsViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welkom terug, {userName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Hier is een overzicht van jouw activiteiten
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Events Card */}
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Evenementen"
          stats={[
            { label: 'Aankomend', value: eventStats.upcoming },
            { label: 'Afgelopen', value: eventStats.past },
            { label: 'Totaal', value: eventStats.all },
          ]}
          color="warm-olive"
        />

        {/* Wishlists Card */}
        <StatCard
          icon={<Gift className="w-6 h-6" />}
          title="Verlanglijstjes"
          stats={[
            { label: 'Publiek', value: wishlistStats.public },
            { label: 'Privé', value: wishlistStats.private },
            { label: 'Totaal', value: wishlistStats.total },
          ]}
          color="cool-olive"
        />

        {/* Followers Card */}
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Volgers"
          stats={[
            { label: 'Volgers', value: followStats.followers },
            { label: 'Volgend', value: followStats.following },
          ]}
          color="warm-olive"
        />

        {/* Activity Card */}
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Activiteit"
          stats={[
            { label: 'Deze maand', value: eventStats.upcoming },
            { label: 'Totaal items', value: eventStats.all + wishlistStats.total },
          ]}
          color="cool-olive"
        />
      </div>
    </div>
  );
}

// ✅ REUSABLE STAT CARD COMPONENT
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  stats: Array<{ label: string; value: number }>;
  color: 'warm-olive' | 'cool-olive';
}

function StatCard({ icon, title, stats, color }: StatCardProps) {
  const colorClasses = {
    'warm-olive': 'bg-warm-olive text-white',
    'cool-olive': 'bg-cool-olive text-white',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className="font-semibold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}