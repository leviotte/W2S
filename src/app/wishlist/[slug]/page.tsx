// src/app/wishlist/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getWishlistBySlugAction, getWishlistOwnerAction } from '@/lib/server/actions/wishlist';
import { getCurrentUser } from '@/lib/auth/actions';
import { WishlistDetailClient } from './_components/wishlist-detail-client';
import type { Metadata } from 'next';

interface WishlistPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ maxPrice?: string }>;
}

// ✅ DYNAMIC METADATA voor SEO
export async function generateMetadata({ params }: WishlistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getWishlistBySlugAction(slug);

  if (!result.success || !result.data) {
    return {
      title: 'Wishlist niet gevonden | Wish2Share',
    };
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

export default async function WishlistPage({ params, searchParams }: WishlistPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const maxPrice = resolvedSearchParams.maxPrice ? Number(resolvedSearchParams.maxPrice) : undefined;

  // Get current user
  const currentUser = await getCurrentUser();

  // Get wishlist
  const wishlistResult = await getWishlistBySlugAction(slug);

  if (!wishlistResult.success || !wishlistResult.data) {
    notFound();
  }

  const wishlist = wishlistResult.data;

  // Get owner
  const ownerResult = await getWishlistOwnerAction(wishlist.ownerId);
  const owner = ownerResult.success ? ownerResult.data : null;

  // Check ownership
  const isOwner = currentUser?.id === wishlist.ownerId;

  return (
    <WishlistDetailClient
      wishlist={wishlist}
      owner={owner}
      currentUser={currentUser}
      isOwner={isOwner}
      maxPrice={maxPrice}
    />
  );
}