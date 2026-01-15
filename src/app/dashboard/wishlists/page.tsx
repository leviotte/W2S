// src/app/dashboard/wishlists/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift } from 'lucide-react';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { adminDb } from '@/lib/server/firebase-admin';
import { type Wishlist, type WishlistItem } from '@/types/wishlist';
import { cookies } from 'next/headers';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistGrid } from './_components/wishlist-grid';

// 👇 Helper: serializeer individuele wishlist items veilig
function serializeWishlistItem(item: any): WishlistItem {
  return {
    ...item,
    addedAt:
      typeof item.addedAt === 'string'
        ? item.addedAt
        : item.addedAt?.toDate?.()
        ? item.addedAt.toDate().toISOString()
        : undefined,
    updatedAt:
      typeof item.updatedAt === 'string'
        ? item.updatedAt
        : item.updatedAt?.toDate?.()
        ? item.updatedAt.toDate().toISOString()
        : undefined,
  };
}

// 👇 Helper: serializeer volledige wishlist
function serializeWishlistDashboard(data: any, idOverride?: string): Wishlist {
  return {
    ...(idOverride ? { id: idOverride } : {}),
    ...data,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : null,
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : data.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : null,
    eventDate:
      typeof data.eventDate === 'string'
        ? data.eventDate
        : data.eventDate?.toDate?.()
        ? data.eventDate.toDate().toISOString()
        : null,
    items: Array.isArray(data.items)
      ? (data.items as any[]).map(serializeWishlistItem)
      : [],
  };
}

// 👇 Haal alle wishlists op voor de actieve gebruiker en profiel
async function loadWishlists(userId: string, activeProfileId: string): Promise<Wishlist[]> {
  try {
    let query = adminDb.collection('wishlists').orderBy('createdAt', 'desc');
    if (activeProfileId === 'main-account') {
      query = query.where('ownerId', '==', userId).where('profileId', '==', null);
    } else {
      query = query.where('ownerId', '==', userId).where('profileId', '==', activeProfileId);
    }

    const snapshot = await query.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => serializeWishlistDashboard(doc.data(), doc.id));
  } catch (error) {
    console.error('Fout bij laden wishlists:', error);
    return [];
  }
}

export default async function WishlistsDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/?auth=login');
  }

  // Converteer sessie naar type dat we intern gebruiken
  const userId = session.user.id;

  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get('activeProfile')?.value || 'main-account';

  const wishlists = await loadWishlists(userId, activeProfileId);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-accent font-bold">Mijn Wishlists</h1>
        <Button
          asChild
          className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Link href="/dashboard/wishlists/create">
            <Gift size={18} />
            Nieuwe Wishlist
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center mt-8">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <WishlistGrid wishlists={wishlists} />
      </Suspense>
    </div>
  );
}
