// src/components/landing/hero-actions.tsx
'use client';

import { Gift, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HeroActions() {
  const router = useRouter();
  const { currentUser, openLoginModal } = useAuth();

  const handleCreateEvent = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    router.push('/dashboard/events/create');
  };

  const handleCreateWishlist = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    router.push('/dashboard/wishlists/create');
  };

  return (
    <div className="mx-auto mt-5 flex max-w-md flex-row items-center justify-center gap-5 md:mt-6">
      {/* Event Button */}
      <div className="w-full sm:w-[48%] md:w-[48%]">
        <button
          onClick={handleCreateEvent} // ✅ FIXED
          className="z-10 flex h-32 w-full min-w-32 flex-col items-center justify-center overflow-hidden rounded-md border-4 border-transparent bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive px-2 text-base font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-cool-olive hover:via-warm-olive hover:to-cool-olive hover:shadow-[0_4px_12px_rgba(72,97,64,0.3)] sm:px-6"
        >
          <Users className="mb-3 h-8 w-8" />
          <span className="px-2 text-md sm:text-lg">Maak een Event</span>
          <span className="text-xs opacity-80 sm:text-sm">
            (Met of zonder lootjes)
          </span>
        </button>
      </div>

      {/* Wishlist Button */}
      <div className="w-full sm:w-[48%] md:w-[48%]">
        <button
          onClick={handleCreateWishlist} // ✅ FIXED
          className="flex h-32 w-full min-w-32 flex-col items-center justify-center overflow-hidden rounded-md border-4 border-transparent bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive px-2 text-base font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-cool-olive hover:via-warm-olive hover:to-cool-olive hover:shadow-[0_4px_12px_rgba(72,97,64,0.3)] sm:px-6"
        >
          <Gift className="mb-3 h-8 w-8" />
          <span className="text-md sm:text-lg">Maak een Wishlist</span>
          <span className="text-xs opacity-80 sm:text-sm">
            (Voor jezelf of anderen)
          </span>
        </button>
      </div>
    </div>
  );
}