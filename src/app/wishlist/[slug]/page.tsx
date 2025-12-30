// src/app/wishlist/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getWishlistBySlugAction } from '@/lib/server/actions/wishlist-read';
import { getWishlistOwnerAction } from '@/lib/server/actions/wishlist-owner';
import { getCurrentUser } from '@/lib/auth/actions';

import { WishlistDetailClient } from './_components/wishlist-detail-client';
import type { AuthenticatedSessionUser } from '@/types/session';
import type { WishlistDetailClientProps } from './_components/wishlist-detail-client';

function mapAuthenticatedUserToClientUser(
  user: AuthenticatedSessionUser
): WishlistDetailClientProps['currentUser'] {
  return {
    id: user.id,
    userId: user.id, // userId gelijk aan id
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    address: null, // fallback, kan je aanpassen als je adresinfo hebt
    isPublic: true,
    isAdmin: user.isAdmin,
    isPartner: user.isPartner,
    sharedWith: [],
    createdAt: new Date(), // fallback, kan je aanpassen
    updatedAt: new Date(), // fallback, kan je aanpassen
    displayName: user.displayName,
    photoURL: user.photoURL ?? null,
    username: user.username,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getWishlistBySlugAction(params.slug);

  if (!result.success) {
    return { title: 'Wishlist niet gevonden | Wish2Share' };
  }

  const wishlist = result.data;

  return {
    title: `${wishlist.name} | Wish2Share`,
    description: wishlist.description ?? `Bekijk de wishlist van ${wishlist.name}`,
    openGraph: {
      title: wishlist.name,
      description: wishlist.description ?? undefined,
      images: wishlist.backgroundImage ? [wishlist.backgroundImage] : undefined,
    },
  };
}

export default async function WishlistPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { maxPrice?: string };
}) {
  const wishlistResult = await getWishlistBySlugAction(params.slug);
  if (!wishlistResult.success) notFound();

  const wishlist = wishlistResult.data;

  const ownerId = wishlist.userId ?? wishlist.ownerId;
  if (!ownerId) notFound();

  const ownerResult = await getWishlistOwnerAction(ownerId);
  const owner = ownerResult.success ? ownerResult.data : null;

  const rawUser = (await getCurrentUser()) as AuthenticatedSessionUser | null;
  const currentUser = rawUser ? mapAuthenticatedUserToClientUser(rawUser) : null;

  const isOwner = !!currentUser && currentUser.id === ownerId;

  const maxPriceNumber = searchParams?.maxPrice
    ? Number(searchParams.maxPrice)
    : undefined;

  return (
    <WishlistDetailClient
      wishlist={wishlist}
      owner={owner}
      currentUser={currentUser}
      isOwner={isOwner}
      maxPrice={maxPriceNumber}
    />
  );
}
