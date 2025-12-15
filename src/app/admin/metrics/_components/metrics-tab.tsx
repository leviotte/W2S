// src/app/admin/metrics/_components/metrics-tab.tsx
'use client';

import CountUp from 'react-countup';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import type { MetricsData } from '@/lib/server/data/metrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  data: MetricsData;
};

export function MetricsTab({ data }: Props) {
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const growthChartData = {
    labels: data.monthLabels,
    datasets: [
      {
        label: 'Nieuwe Gebruikers',
        data: data.monthlyUsers,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Nieuwe Wishlists',
        data: data.monthlyWishlists,
        borderColor: 'rgb(243, 9, 44)',
        backgroundColor: 'rgba(255, 99, 117, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Nieuwe Events',
        data: data.monthlyEvents,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const totalChartData = {
    labels: data.monthLabels,
    datasets: [
      {
        label: 'Totaal Gebruikers',
        data: data.cumulativeUsers,
        borderColor: 'rgb(75, 108, 192)',
        backgroundColor: 'rgba(75, 165, 192, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Totaal Wishlists',
        data: data.cumulativeWishlists,
        borderColor: 'rgb(75, 192, 102)',
        backgroundColor: 'rgba(104, 255, 99, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Totaal Events',
        data: data.cumulativeEvents,
        borderColor: 'rgb(243, 9, 52)',
        backgroundColor: 'rgba(255, 99, 177, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Gebruikers" value={data.totalUsers} color="blue" />
        <StatCard title="Events" value={data.totalEvents} color="green" />
        <StatCard title="Wishlists" value={data.totalWishlists} color="purple" />
        <StatCard 
          title="Wishlists per Gebruiker" 
          value={data.wishlistUserPercentage}
          decimals={1}
          suffix="%"
          color="orange"
        />
        <StatCard 
          title="Events per Gebruiker" 
          value={data.eventUserPercentage}
          decimals={1}
          suffix="%"
          color="pink"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
          Nieuwe Gebruikers, Wishlists & Events (Laatste 12 Maanden)
        </h2>
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[400px]">
          <Line data={growthChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
          Totaal Gebruikers, Wishlists & Events (Laatste 12 Maanden)
        </h2>
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 xl:h-[400px]">
          <Line data={totalChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
};

function StatCard({ 
  title, 
  value, 
  decimals = 0, 
  suffix = '', 
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    pink: 'from-pink-50 to-pink-100 border-pink-200',
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
      <h3 className="text-sm font-medium text-gray-600 text-center mb-2">
        {title}
      </h3>
      <p className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
        <CountUp 
          start={0} 
          end={value} 
          duration={2}
          decimals={decimals}
          separator="."
          decimal=","
        />
        {suffix && <span className="text-2xl ml-1">{suffix}</span>}
      </p>
    </div>
  );
}