'use client';

import { TrendingUp, ShoppingCart, MousePointerClick, Store } from 'lucide-react';
import CountUp from 'react-countup';
import type { AffiliateStats } from '@/types/affiliate';

type Props = {
  stats: AffiliateStats;
};

export function AffiliateStoresStats({ stats }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Affiliate Stores Statistieken
        </h2>
        <p className="text-gray-600 mt-1">
          Overzicht van je affiliate programma's
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Stores */}
        <StatCard
          title="Stores"
          value={stats.stores}
          icon={<Store className="w-6 h-6" />}
          color="blue"
        />

        {/* Bol Items */}
        <StatCard
          title="Bol Items"
          value={stats.bolItems}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
          badge="Bol.com"
        />

        {/* Amazon Items */}
        <StatCard
          title="Amazon Items"
          value={stats.amazonItems}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="yellow"
          badge="Amazon"
        />

        {/* Bol Clicks */}
        <StatCard
          title="Bol Clicks"
          value={stats.bolClicks}
          icon={<MousePointerClick className="w-6 h-6" />}
          color="green"
          badge="Bol.com"
        />

        {/* Amazon Clicks */}
        <StatCard
          title="Amazon Clicks"
          value={stats.amazonClicks}
          icon={<MousePointerClick className="w-6 h-6" />}
          color="purple"
          badge="Amazon"
        />
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConversionCard
          title="Bol.com Conversie"
          items={stats.bolItems}
          clicks={stats.bolClicks}
          color="orange"
        />
        <ConversionCard
          title="Amazon Conversie"
          items={stats.amazonItems}
          clicks={stats.amazonClicks}
          color="yellow"
        />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

type StatCardProps = {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'orange' | 'yellow' | 'green' | 'purple';
  badge?: string;
};

function StatCard({ title, value, icon, color = 'blue', badge }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${colorClasses[color]}
        border shadow-sm p-6 rounded-lg
        hover:shadow-md transition-all duration-300
        transform hover:-translate-y-1
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className={iconColorClasses[color]}>
            {icon}
          </div>
        )}
      </div>
      
      <p className="text-4xl font-bold text-gray-900 mb-2">
        <CountUp 
          start={0} 
          end={value} 
          duration={2}
          separator="."
        />
      </p>

      {badge && (
        <span className="inline-block text-xs bg-white/50 px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

type ConversionCardProps = {
  title: string;
  items: number;
  clicks: number;
  color: 'orange' | 'yellow';
};

function ConversionCard({ title, items, clicks, color }: ConversionCardProps) {
  const clickThroughRate = items > 0 ? (clicks / items) * 100 : 0;
  
  const colorClasses = {
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  const progressColorClasses = {
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={`${colorClasses[color]} border p-6 rounded-lg`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <TrendingUp className="w-5 h-5 text-gray-600" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items in wishlists:</span>
          <span className="font-semibold">{items}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Totaal clicks:</span>
          <span className="font-semibold">{clicks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Click-through rate:</span>
          <span className="font-bold text-lg">
            <CountUp 
              start={0} 
              end={clickThroughRate} 
              duration={2}
              decimals={1}
              decimal=","
            />%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${progressColorClasses[color]} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(clickThroughRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}