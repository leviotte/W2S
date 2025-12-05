/**
 * components/landing/hero-actions.tsx
 *
 * Client Component met de twee belangrijkste Call-to-Action knoppen.
 * Gebruikt de useAuthStore om de user-state te lezen en de useAuthModal hook
 * om de login modal te openen.
 */
'use client';

import { useRouter } from 'next/navigation';
import { Gift, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
// CORRECTE IMPORTS: We halen de store en de custom hook apart op.
import { useAuthStore, useAuthModal } from '@/lib/store/use-auth-store';

export default function HeroActions() {
  const router = useRouter();
  
  // 1. We halen de ingelogde gebruiker op om te bepalen of we moeten navigeren.
  const currentUser = useAuthStore((state) => state.currentUser);
  
  // 2. We gebruiken jouw briljante custom hook om de modal te kunnen tonen.
  const { showLogin } = useAuthModal();

  const handleNavigation = (path: string) => {
    // Als er GEEN gebruiker is, roep dan de 'showLogin' functie uit de store aan.
    if (!currentUser) {
      showLogin();
    } else {
      // Als er WEL een gebruiker is, navigeer dan.
      router.push(path);
    }
  };

  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row md:mt-10">
      <Button
        size="lg"
        className="h-28 flex-1 flex-col gap-2 !text-lg"
        onClick={() => handleNavigation('/dashboard/events/create')} // Tip: cleanere URL's
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
        onClick={() => handleNavigation('/dashboard/wishlists/create')} // Tip: cleanere URL's
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