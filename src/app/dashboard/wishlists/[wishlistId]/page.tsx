// src/app/dashboard/wishlists/[wishlistId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { WishlistDetailClient } from '@/app/wishlist/[slug]/_components/wishlist-detail-client';
import type { UserProfile } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';
import { isOwnerOfWishlist } from '@/lib/utils/is-owner-of-wishlist';
import { getActiveProfileId } from '@/lib/auth/active-profile';

export const dynamic = 'force-dynamic';

interface WishlistDetailPageProps {
  params: { wishlistId: string };
}

async function getWishlistForDashboard(
  wishlistId: string,
  sessionUserId: string,
  activeProfileId: string | null
) {
  if (!wishlistId) return { wishlist: null, owner: null, isOwner: false };
  const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();
  if (!wishlistDoc.exists) return { wishlist: null, owner: null, isOwner: false };
  const data = wishlistDoc.data();
  if (!data) return { wishlist: null, owner: null, isOwner: false };

  const wishlist = {
    id: wishlistDoc.id,
    name: data.name || '',
    ownerId: data.ownerId || data.userId || '',
    profileId: data.profileId || null,
    slug: data.slug || null,
    isPublic: data.isPublic !== undefined ? data.isPublic : data.isPrivate === false,
    items: data.items || [],
    backgroundImage: data.backgroundImage || '',
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  } as Wishlist & { profileId?: string | null; ownerId: string; };

  const isOwner = isOwnerOfWishlist({ wishlist, sessionUserId, activeProfileId });

  let owner: UserProfile | null = null;
  if (isOwner) {
    if (activeProfileId && activeProfileId !== 'main-account') {
      const profileDoc = await adminDb.collection('profiles').doc(activeProfileId).get();
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        owner = { id: profileDoc.id, ...profileData } as UserProfile;
      }
    } else {
      const userDoc = await adminDb.collection('users').doc(sessionUserId).get();
      if (userDoc.exists) {
        const ownerData = userDoc.data();
        owner = { id: userDoc.id, ...ownerData } as UserProfile;
      }
    }
  }
  return { wishlist, owner, isOwner };
}

export default async function DashboardWishlistDetailPage({ params }: WishlistDetailPageProps) {
  const { wishlistId } = params;
  const session = await getSession();
  if (!session.user) redirect('/login');
  const activeProfileId = await getActiveProfileId();
  const { wishlist, owner, isOwner } = await getWishlistForDashboard(
    wishlistId,
    session.user.id,
    activeProfileId,
  );
  if (!wishlist) notFound();
  if (!isOwner || !owner) notFound();

  return (
    <WishlistDetailClient
      wishlist={wishlist}
      owner={owner}
      currentUser={owner}
      isOwner={isOwner}
    />
  );
}