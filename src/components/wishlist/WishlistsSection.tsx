// src/components/wishlist/WishlistsSection.tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import { toast } from 'sonner';

import type { Event, EventParticipant } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';
import type { AuthedUser } from '@/types';

import { UserAvatar } from '../shared/user-avatar';

interface WishlistsSectionProps {
  event: Event;
  participants: EventParticipant[];
  wishlists: Record<string, Wishlist>;
  currentUser: AuthedUser | null;
  currentUserId: string;
}

export default function WishlistsSection({ event, participants, wishlists, currentUserId }: WishlistsSectionProps) {
  const router = useRouter();

  const participantsWithWishlists = useMemo(() => {
    return participants.map(p => ({
      ...p,
      wishlist: p.wishlistId ? wishlists[p.wishlistId] : undefined,
    }));
  }, [participants, wishlists]);

  // ... (handleWishlistAction blijft hetzelfde) ...

  return (
    <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <Gift className="w-6 h-6" /> Deelnemers & Wenslijsten
      </h2>
      <div className="grid gap-3">
        {participantsWithWishlists.map((p) => (
          <div key={p.id} /* ... */>
            <div className="flex items-center gap-3">
              {/* 
                GOLD STANDARD FIX: We gebruiken nu de correcte props 'name' en 'src' 
                zoals gedefinieerd in het UserAvatar component zelf.
              */}
              <UserAvatar
                name={`${p.firstName} ${p.lastName}`}
                src={p.photoURL} // Gebruikt de photoURL die we in event.ts hebben toegevoegd
              />
              <div>
                {/* ... */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}