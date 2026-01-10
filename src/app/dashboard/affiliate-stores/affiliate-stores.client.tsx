'use client';

import { useState } from 'react';

interface Stats {
  stores: number;
  bolItems: number;
  amazonItems: number;
  bolClicks: number;
  amazonClicks: number;
}

interface Props {
  stats: Stats;
}

export default function AffiliateStoresClient({ stats }: Props) {
  // voorbeeld van client-interacties: live filter of highlight
  const [highlight, setHighlight] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#606c38] mb-2">
          Affiliate Stores Stats
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: 'Stores', value: stats.stores },
          { title: 'Bol Items', value: stats.bolItems },
          { title: 'Amazon Items', value: stats.amazonItems },
          { title: 'Bol Clicks', value: stats.bolClicks },
          { title: 'Amazon Clicks', value: stats.amazonClicks },
        ].map((stat) => (
          <div
            key={stat.title}
            onMouseEnter={() => setHighlight(stat.title)}
            onMouseLeave={() => setHighlight(null)}
            className={`bg-gray-50 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center transition ${
              highlight === stat.title ? 'bg-[#f0f5e1]' : ''
            }`}
          >
            <h2 className="text-xl text-gray-800 font-medium mb-4">{stat.title}</h2>
            <p className="text-5xl font-bold text-[#606c38]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
