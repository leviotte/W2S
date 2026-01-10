// src/app/event/_components/EventWishlistSelector.server.tsx
import { getSession } from '@/lib/auth/session.server';
import { getWishlistsByOwnerId } from '@/lib/server/actions/wishlist';
import { EventWishlistSelectorClient } from './EventWishlistSelector.client';
import type { Wishlist } from '@/types/wishlist';

interface Props {
  selectedWishlistId?: string;
  onSelectServerAction: (wishlistId: string) => void;
}

export default async function EventWishlistSelectorServer(props: Props) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) return null;

  const userId = session.user.id;
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
