// src/app/wishlist/_components/WishlistSelector.server.tsx
import { getSession } from '@/lib/auth/session.server';
import { getWishlistsByOwnerId } from '@/lib/server/actions/wishlist';
import { WishlistSelectorClient } from './WishlistSelector.client';

interface Props {
  selectedWishlistId?: string;
  onSelect: (wishlistId: string) => void;
  onCreateNew: () => void;
}

export default async function WishlistSelectorServer(props: Props) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) return null;

  const userId = session.user.id;
  const result = await getWishlistsByOwnerId(userId); // bewaar als result
  if (!result.success) throw new Error('Kon wishlists niet ophalen');

  const wishlists = result.data; // TS weet nu dat data bestaat
  return (
    <WishlistSelectorClient
      {...props}
      wishlists={wishlists}
    />
  );
}