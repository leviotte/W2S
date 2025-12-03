import { NextResponse } from 'next/server';
import { db } from '@/lib/server/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // --- Gold Standard Security ---
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let updatedEventsCount = 0;

  try {
    const eventsSnapshot = await db.collection('events').get();
    const batch = db.batch();

    eventsSnapshot.docs.forEach((doc) => {
      const eventData = doc.data();
      const messages: { timestamp: number }[] = eventData?.messages || [];
      
      // Converteer Firestore Timestamps indien nodig, of ga ervan uit dat het Date objecten/strings zijn
      const filteredMessages = messages.filter((msg) => {
        const msgDate = new Date(msg.timestamp); // Zorg dat de timestamp correct geconverteerd wordt
        return msgDate > thirtyDaysAgo;
      });

      if (filteredMessages.length < messages.length) {
        batch.update(doc.ref, { messages: filteredMessages });
        updatedEventsCount++;
      }
    });

    if (updatedEventsCount > 0) {
      await batch.commit();
    }
    
    console.log(`Cleanup old messages: Updated ${updatedEventsCount} events.`);
    return NextResponse.json({ success: true, message: `Updated ${updatedEventsCount} events.` });

  } catch (error) {
    console.error('Error in cleanup-old-messages cron job:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}