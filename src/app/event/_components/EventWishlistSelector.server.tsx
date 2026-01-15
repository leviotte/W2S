// src/app/event/_components/EventWishlistSelector.server.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getWishlistsByOwnerId } from '@/lib/server/actions/wishlist';
import { EventWishlistSelectorClient } from './EventWishlistSelector.client';
import type { Wishlist } from '@/types/wishlist';

interface Props {
  selectedWishlistId?: string;
  onSelectServerAction: (wishlistId: string) => void;
}

export default async function EventWishlistSelectorServer(props: Props) {
  // ✅ Haal sessie op via NextAuth
  const session = await getServerSession(authOptions);

  // ❌ Als geen sessie, return null
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // ✅ Haal alle wishlists van deze gebruiker op
  const result = await getWishlistsByOwnerId(userId);
  if (!result.success) throw new Error('Kon wishlists niet ophalen');

  const wishlists: Wishlist[] = result.data;

  return (
    <EventWishlistSelectorClient
      {...props}
      wishlists={wishlists}
      userId={userId}
    />
  );
}
