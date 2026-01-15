// src/app/event/_components/EventWishlistLink.server.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getWishlistsByOwnerId } from '@/lib/server/actions/wishlist';
import { WishlistLinkModalClient } from '@/app/_components/WishlistLinkModal.client';
import type { Wishlist } from '@/types/wishlist';

interface Props {
  eventId: string;
  eventName: string;
  participantId?: string;
  modalOpen: boolean;
  onModalChange: (open: boolean) => void;
}

export default async function EventWishlistLinkServer({
  eventId,
  eventName,
  participantId,
  modalOpen,
  onModalChange,
}: Props) {
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
    <WishlistLinkModalClient
      open={modalOpen}
      onOpenChange={onModalChange}
      eventId={eventId}
      eventName={eventName}
      participantId={participantId ?? ''} // fallback naar lege string
      wishlists={wishlists}
      userId={userId}
    />
  );
}
