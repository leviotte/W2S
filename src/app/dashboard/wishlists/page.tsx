// src/app/dashboard/wishlists/page.tsx 
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { type Wishlist } from '@/types/wishlist';

import PageTitle from '@/components/layout/page-title';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistGrid } from './_components/wishlist-grid';
import Link from 'next/link';
import { Gift } from 'lucide-react';

async function loadWishlists(userId: string): Promise<Wishlist[]> {
  try {
    const snapshot = await adminDb.collection('wishlists')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
      
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Zorg ervoor dat timestamps omgezet worden naar een serializeerbaar formaat
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
    })) as Wishlist[];
  } catch (error) {
    console.error("Failed to load wishlists on server:", error);
    return [];
  }
}

export default async function WishlistsDashboardPage() {
  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }

  // Data wordt hier op de server geladen! Geen client-side useEffect meer.
  const wishlists = await loadWishlists(session.user.id);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Mijn Wishlists" />
        <Button asChild className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2 flex items-center gap-2">
          <Link href="/dashboard/wishlists/create">
            <Gift size={18} />
            Nieuwe Wishlist
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="flex justify-center mt-8"><LoadingSpinner size="lg" /></div>}>
        <WishlistGrid initialWishlists={wishlists} />
      </Suspense>
    </div>
  );
}