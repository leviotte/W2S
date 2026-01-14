// src/components/landing/hero-actions.tsx
'use client';

import { Gift, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroActions() {
  const router = useRouter();

  return (
    <div className="mx-auto mt-5 flex max-w-md flex-row items-center justify-center gap-5 md:mt-6">
      <div className="w-full sm:w-[48%]">
        <button
          onClick={() => router.push('/dashboard/events/create')}
          className="flex h-32 w-full flex-col items-center justify-center rounded-md bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive text-white transition hover:scale-105"
        >
          <Users className="mb-3 h-8 w-8" />
          <span className="text-lg">Maak een Event</span>
          <span className="text-sm opacity-80">(Met of zonder lootjes)</span>
        </button>
      </div>

      <div className="w-full sm:w-[48%]">
        <button
          onClick={() => router.push('/dashboard/wishlists/create')}
          className="flex h-32 w-full flex-col items-center justify-center rounded-md bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive text-white transition hover:scale-105"
        >
          <Gift className="mb-3 h-8 w-8" />
          <span className="text-lg">Maak een Wishlist</span>
          <span className="text-sm opacity-80">(Voor jezelf of anderen)</span>
        </button>
      </div>
    </div>
  );
}
