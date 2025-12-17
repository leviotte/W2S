// src/app/dashboard/wishlists/[wishlistId]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { WishlistDetailClient } from '@/app/wishlist/[slug]/_components/wishlist-detail-client';
import type { UserProfile } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';

// Vertel Next.js om deze pagina altijd dynamisch te renderen.
export const dynamic = 'force-dynamic';

interface WishlistDetailPageProps {
  params: { wishlistId: string };
}

// *** DE OPLOSSING ZIT HIER ***
async function getWishlistForDashboard(wishlistId: string, userId: string) {
  if (!wishlistId) {
    return { wishlist: null, owner: null, isOwner: false };
  }
  
  const wishlistDoc = await adminDb.collection('wishlists').doc(wishlistId).get();

  if (!wishlistDoc.exists) {
    return { wishlist: null, owner: null, isOwner: false };
  }

  const data = wishlistDoc.data();
  if (!data) {
    return { wishlist: null, owner: null, isOwner: false };
  }
  
  // CONVERSIE: Firebase Timestamps zijn niet "plain", dus we maken er ISO strings van.
  const wishlist = {
    id: wishlistDoc.id,
    name: data.name || '',
    // AANGEPAST: in je datamodel is dit userId, geen ownerId
    ownerId: data.userId || '',
    // AANGEPAST: in je datamodel is dit isPrivate, geen isPublic
    isPublic: data.isPrivate === false, 
    items: data.items || [],
    backgroundImage: data.backgroundImage || '',
    // Veilig converteren: als het een Timestamp is, converteer. Anders, gebruik de waarde.
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  } as Wishlist;

  const isOwner = wishlist.ownerId === userId;

  let owner: UserProfile | null = null;
  if (isOwner) {
    const ownerDoc = await adminDb.collection('users').doc(userId).get();
    if (ownerDoc && ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        if (ownerData) {
            // CONVERSIE: Ook hier de Timestamps van de gebruiker omzetten.
            owner = {
                id: ownerDoc.id,
                ...ownerData,
                // Veilig converteren voor de eigenaar
                createdAt: ownerData.createdAt?.toDate ? ownerData.createdAt.toDate().toISOString() : ownerData.createdAt,
                updatedAt: ownerData.updatedAt?.toDate ? ownerData.updatedAt.toDate().toISOString() : ownerData.updatedAt,
            } as UserProfile;
        }
    }
  }
  
  return { wishlist, owner, isOwner };
}

export default async function DashboardWishlistDetailPage({ params }: WishlistDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { wishlistId } = resolvedParams;

  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }

  const { wishlist, owner, isOwner } = await getWishlistForDashboard(wishlistId, session.user.id);

  if (!wishlist) {
    notFound();
  }
  
  if (!isOwner || !owner) {
    console.error(`Eigenaar niet gevonden voor wishlist ${wishlistId}, maar gebruiker ${session.user.id} is ingelogd.`);
    notFound(); 
  }

  return (
    <WishlistDetailClient 
      wishlist={wishlist}
      owner={owner}
      currentUser={owner}
      isOwner={isOwner}
    />
  );
}