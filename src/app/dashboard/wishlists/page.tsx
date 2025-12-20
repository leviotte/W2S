// src/app/dashboard/wishlists/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift } from 'lucide-react';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { type Wishlist } from '@/types/wishlist';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistGrid } from './_components/wishlist-grid';

async function loadWishlists(userId: string): Promise<Wishlist[]> {
  try {
    const snapshot = await adminDb
      .collection('wishlists')
      .where('ownerId', '==', userId)
      .where('profileId', '==', null)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
        eventDate: data.eventDate?.toDate?.().toISOString() || data.eventDate || null,
      };
    }) as Wishlist[];
  } catch {
    return [];
  }
}

export default async function WishlistsDashboardPage() {
  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }

  const wishlists = await loadWishlists(session.user.id);

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

      <Suspense fallback={<div className="flex justify-center mt-8"><LoadingSpinner size="lg" /></div>}>
        <WishlistGrid wishlists={wishlists} />
      </Suspense>
    </div>
  );
}