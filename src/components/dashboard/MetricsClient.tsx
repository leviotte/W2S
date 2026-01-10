// src/components/dashboard/MetricsClient.tsx
'use client';

import { Line } from 'react-chartjs-2';
import CountUp from 'react-countup';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Statistics } from '@/lib/server/statistics.server';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MetricsClientProps {
  stats: Statistics;
}

export default function MetricsClient({ stats }: MetricsClientProps) {
  const growthChartData = {
    labels: stats.monthLabels,
    datasets: [
      {
        label: 'New Users',
        data: stats.monthlyUsers,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
      {
        label: 'New Wishlists',
        data: stats.monthlyWishlists,
        borderColor: 'rgba(243,9,44,1)',
        backgroundColor: 'rgba(255,99,117,0.2)',
      },
    ],
  };

  const totalChartData = {
    labels: stats.monthLabels,
    datasets: [
      {
        label: 'Users',
        data: stats.cumulativeUsers,
        borderColor: 'rgba(75,108,192,1)',
        backgroundColor: 'rgba(75,165,192,0.2)',
      },
      {
        label: 'Wishlists',
        data: stats.cumulativeWishlists,
        borderColor: 'rgba(75,192,102,1)',
        backgroundColor: 'rgba(104,255,99,0.2)',
      },
      {
        label: 'Events',
        data: stats.cumulativeEvents,
        borderColor: 'rgba(243,9,52,1)',
        backgroundColor: 'rgba(255,99,177,0.2)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full justify-items-center">
        {[
          { label: 'Users', value: stats.totalUsers },
          { label: 'Events', value: stats.totalEvents },
          { label: 'Wishlists', value: stats.totalWishlists },
          { label: 'Wishlist/User', value: stats.wishlistUserPercentage, isPercent: true },
          { label: 'Events/User', value: stats.eventUserPercentage, isPercent: true },
        ].map(({ label, value, isPercent }) => (
          <div
            key={label}
            className="bg-gray-50 shadow-md p-6 rounded-lg w-full sm:w-60 lg:w-48 hover:shadow-lg transition-shadow duration-500"
          >
            <h2 className="text-center text-lg md:text-2xl text-cool-olive font-semibold">{label}</h2>
            <p className="text-center font-bold mt-2 text-2xl md:text-4xl text-warm-olive">
              <CountUp start={0} end={value} duration={1} decimals={isPercent ? 1 : 0} />
              {isPercent ? '%' : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg w-full mb-16 lg:w-11/12">
        <h2 className="text-xl md:text-2xl font-bold text-warm-olive mb-4 text-center">
          New Users & Wishlists (Last 12 Months)
        </h2>
        <div className="relative h-80">
          <Line
            data={growthChartData}
            options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg w-full mb-16 lg:w-11/12">
        <h2 className="text-xl md:text-2xl font-bold text-warm-olive mb-4 text-center">
          Total Users, Wishlists & Events (Last 12 Months)
        </h2>
        <div className="relative h-80">
          <Line
            data={totalChartData}
            options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
          />
        </div>
      </div>
    </div>
  );
}
