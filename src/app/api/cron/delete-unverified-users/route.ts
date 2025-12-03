import { NextResponse } from 'next/server';
import { db, auth, admin } from '@/lib/server/firebaseAdmin';

// Forceer de route om dynamisch te zijn en niet gecached te worden
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // --- Gold Standard Security ---
  // Bescherm je cron jobs zodat niet iedereen ze kan triggeren.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const threeDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  let deletedCount = 0;

  try {
    const snapshot = await db
      .collection('users')
      .where('emailVerified', '==', false)
      .where('createdAt', '<', threeDaysAgo)
      .get();

    if (snapshot.empty) {
      console.log('No unverified users to delete.');
      return NextResponse.json({ success: true, message: 'No unverified users to delete.' });
    }

    const deletionPromises = snapshot.docs.map(async (doc) => {
      console.log(`Preparing to delete unverified user: ${doc.id}`);
      await auth.deleteUser(doc.id);
      await doc.ref.delete();
      deletedCount++;
    });

    await Promise.all(deletionPromises);
    console.log(`Successfully deleted ${deletedCount} unverified users.`);
    return NextResponse.json({ success: true, message: `Deleted ${deletedCount} users.` });

  } catch (error) {
    console.error('Error in delete-unverified-users cron job:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}