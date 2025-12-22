// src/app/wishlist/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getWishlistBySlugAction, getWishlistOwnerAction } from '@/lib/server/actions/wishlist';
import { getCurrentUser } from '@/lib/auth/actions';
import { WishlistDetailClient } from './_components/wishlist-detail-client';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getWishlistBySlugAction(slug);
  if (!result.success || !result.data) {
    return { title: 'Wishlist niet gevonden | Wish2Share' };
  }
  return {
    title: `${result.data.name} | Wish2Share`,
    description: result.data.description || `Bekijk de wishlist van ${result.data.name}`,
    openGraph: {
      title: result.data.name,
      description: result.data.description || undefined,
      images: result.data.backgroundImage ? [result.data.backgroundImage] : undefined,
    },
  };
}

export default async function WishlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ maxPrice?: string }>;
}) {
  const { slug } = await params;
  const { maxPrice } = await searchParams;
  const maxPriceNumber = maxPrice ? Number(maxPrice) : undefined;
  const currentUser = await getCurrentUser();

  const wishlistResult = await getWishlistBySlugAction(slug);
  if (!wishlistResult.success || !wishlistResult.data) notFound();
  const wishlist = wishlistResult.data;

  const ownerId: string | undefined = wishlist.userId ?? wishlist.ownerId;
  if (!ownerId) notFound();

  const ownerResult = await getWishlistOwnerAction(ownerId);
  const owner = ownerResult.success ? ownerResult.data : null;
  const isOwner = currentUser?.id === ownerId;

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