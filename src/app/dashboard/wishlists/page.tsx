import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift } from 'lucide-react';

import { getSession } from '@/lib/auth/actions';
import { adminDb } from '@/lib/server/firebase-admin';
import { type Wishlist } from '@/types/wishlist';

import PageTitle from '@/components/layout/page-title';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistGrid } from './_components/wishlist-grid';

// FIX: Aangepaste functie om de correcte veldnamen te gebruiken
async function loadWishlists(userId: string): Promise<Wishlist[]> {
  try {
    // FIX: 'ownerId' veranderd naar 'userId' om overeen te komen met je datamodel
    const snapshot = await adminDb.collection('wishlists')
      .where('userId', '==', userId) 
      .orderBy('createdAt', 'desc')
      .get();
      
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  // Omdat 'createdAt' al een string is, gebruiken we die gewoon direct.
  createdAt: doc.data().createdAt || new Date().toISOString(),
  updatedAt: doc.data().updatedAt || new Date().toISOString(),
})) as Wishlist[];
  } catch (error) {
    console.error("Failed to load wishlists on server:", error);
    // BELANGRIJK: Omdat de index-fout een error gooit, moet je de Firebase console link volgen!
    // De foutmelding in je terminal bevat de link om de juiste index aan te maken:
    // Query: WHERE userId == ??? ORDER BY createdAt DESC
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
        <PageTitle title="Mijn Wishlists" />
        <Button asChild className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2 flex items-center gap-2">
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