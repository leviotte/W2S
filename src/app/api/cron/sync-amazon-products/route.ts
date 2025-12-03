import { NextResponse } from 'next/server';
import { db } from '@/lib/server/firebaseAdmin';
import { PaapiClient, type PaapiRequest } from 'amazon-pa-api5-node-ts';

export const dynamic = 'force-dynamic';

const amazonClient = new PaapiClient({
  accessKey: process.env.AMAZON_ACCESS_KEY!,
  secretKey: process.env.AMAZON_SECRET_KEY!,
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
  region: 'us-east-1', // Pas aan indien nodig
});

export async function GET(request: Request) {
  // --- Gold Standard Security ---
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const requestParams: PaapiRequest = {
    Keywords: 'laptop', // Misschien wil je dit dynamischer maken?
    SearchIndex: 'All',
    Resources: [
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'ItemInfo.ByLineInfo',
      'Images.Primary.Large',
      'DetailPageURL',
    ],
  };

  try {
    const response = await amazonClient.searchItems(requestParams);
    const items = response.ItemsResult?.Items || [];
    let savedCount = 0;

    if (items.length > 0) {
      const batch = db.batch();

      items.forEach((item) => {
        if (!item.ASIN) return; // Sla items zonder ASIN over
        const productRef = db.collection('amazon_products').doc(item.ASIN);
        
        batch.set(productRef, {
          title: item.ItemInfo?.Title?.DisplayValue || '',
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || '',
          url: item.DetailPageURL || '',
          image: item.Images?.Primary?.Large?.URL || '',
          syncedAt: new Date(),
        });
      });

      await batch.commit();
      savedCount = items.length;
    }

    console.log(`Synced ${savedCount} Amazon products.`);
    return NextResponse.json({ success: true, message: `Synced ${savedCount} products.` });

  } catch (error) {
    console.error('Error in sync-amazon-products cron job:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}