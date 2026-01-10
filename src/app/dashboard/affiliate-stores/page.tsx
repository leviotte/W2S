// app/dashboard/affiliate-stores/page.tsx
import 'server-only';

import { adminDb } from '@/lib/server/firebase-admin';
import AffiliateStoresClient from './affiliate-stores.client';

export const revalidate = 0; // elke keer vers, ISR indien gewenst aanpassen

interface Stats {
  stores: number;
  bolItems: number;
  amazonItems: number;
  bolClicks: number;
  amazonClicks: number;
}

export default async function AffiliateStoresPage() {
  // ======================
  // FETCH DATA SERVER-SIDE
  // ======================

  const wishlistsSnapshot = await adminDb.collection('wishlists').get();

  let bolItemsCount = 0;
  let amazonItemsCount = 0;

  wishlistsSnapshot.forEach((doc) => {
    const wishlist = doc.data();
    if (wishlist.items && Array.isArray(wishlist.items)) {
      wishlist.items.forEach((item: any) => {
        if (item.source === 'BOL') bolItemsCount++;
        if (item.source === 'AMZ') amazonItemsCount++;
      });
    }
  });

  const clicksSnapshot = await adminDb.collection('clicks').get();

  let bolClicks = 0;
  let amazonClicks = 0;

  clicksSnapshot.forEach((doc) => {
    const click = doc.data();
    if (click.source === 'BOL') bolClicks++;
    if (click.source === 'AMZ') amazonClicks++;
  });

  const storesCount = 2; // of tel vanuit stores collection

  const stats: Stats = {
    stores: storesCount,
    bolItems: bolItemsCount,
    amazonItems: amazonItemsCount,
    bolClicks,
    amazonClicks,
  };

  return <AffiliateStoresClient stats={stats} />;
}
