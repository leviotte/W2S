// src/components/landing/hero-actions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Gift, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
// FIX: Correcte import van beide hooks
import { useAuthStore, useAuthModal } from '@/lib/store/use-auth-store';

export default function HeroActions() {
  const router = useRouter();
  
  const currentUser = useAuthStore((state) => state.currentUser);
  // FIX: We halen de 'open' functie op uit de modal-specifieke hook
  const { open: openModal } = useAuthModal();

  const handleNavigation = (path: string) => {
    if (!currentUser) {
      // FIX: Roep de 'open' functie aan met 'login' als argument
      openModal('login');
    } else {
      router.push(path);
    }
  };

  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row md:mt-10">
      <Button
        size="lg"
        className="h-28 flex-1 flex-col gap-2 !text-lg"
        // FIX: Correcte onClick syntax
        onClick={() => handleNavigation('/dashboard/event/create')} 
      >
        <Users className="h-7 w-7" />
        <div>
          Maak een Event
          <p className="text-sm font-normal opacity-80">(Met of zonder lootjes)</p>
        </div>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="h-28 flex-1 flex-col gap-2 !text-lg"
        // FIX: Correcte onClick syntax
        onClick={() => handleNavigation('/dashboard/wishlist/create')}
      >
        <Gift className="h-7 w-7" />
        <div>
          Maak een Wishlist
          <p className="text-sm font-normal opacity-80">(Voor jezelf of anderen)</p>
        </div>
      </Button>
    </div>
  );
}