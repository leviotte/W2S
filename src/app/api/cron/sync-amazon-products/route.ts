// src/app/api/cron/sync-amazon-products/route.ts
import { type NextRequest, NextResponse } from 'next/server'; // <-- DE FIX!
import { getAmazonProducts } from '@/lib/services/amazonService';
import { adminDb } from '@/lib/server/firebase-admin';
import { Product } from '@/types/product';

const SYNC_KEYWORDS = ["populaire gadgets", "nieuwe boeken", "keukenapparatuur"];

export async function GET(req: NextRequest) { // Nu weet TypeScript wat dit is
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('🚀 Starting scheduled Amazon product sync...');

  try {
    const allProducts: Product[] = [];

    for (const keyword of SYNC_KEYWORDS) {
      const products = await getAmazonProducts({ query: keyword, limit: 5 });
      allProducts.push(...products);
    }
    
    const uniqueProducts = new Map<string, Product>();
    allProducts.forEach(product => uniqueProducts.set(product.id.toString(), product));

    const batch = adminDb.batch();
    const productsCollection = adminDb.collection('syncedProducts');

    uniqueProducts.forEach(product => {
      const docRef = productsCollection.doc(product.id.toString());
      batch.set(docRef, product, { merge: true });
    });

    await batch.commit();

    console.log(`✅ Successfully synced ${uniqueProducts.size} unique products to Firestore.`);
    return NextResponse.json({ success: true, syncedCount: uniqueProducts.size });

  } catch (error) {
    console.error('❌ Error during scheduled Amazon sync:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}