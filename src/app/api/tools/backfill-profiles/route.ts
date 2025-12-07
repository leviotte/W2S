// src/app/api/tools/backfill-profiles/route.ts
import { NextResponse } from 'next/server';
// DE CORRECTIE: We gebruiken jouw bestaande 'gold standard' admin setup.
import { adminDb } from '@/lib/server/firebase-admin'; 
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Beveilig de route. Zorg dat ADMIN_SECRET_KEY in .env.local staat.
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profilesRef = adminDb.collection('profiles');
    const profilesSnapshot = await profilesRef.get();
    
    const batch = adminDb.batch();
    let updatedCount = 0;

    profilesSnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const profileData = doc.data();
      
      if (!profileData.name && (profileData.firstName || profileData.lastName)) {
        const name = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
        if (name) {
          const profileDocRef = profilesRef.doc(doc.id);
          batch.update(profileDocRef, { name });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully backfilled ${updatedCount} profile names.`);
      return NextResponse.json({ message: `Successfully backfilled ${updatedCount} profile names.` });
    }

    return NextResponse.json({ message: 'No profiles needed updating.' });

  } catch (error) {
    console.error('Error during profile name backfill:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}