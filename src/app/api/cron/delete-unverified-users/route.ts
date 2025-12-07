// src/app/api/cron/delete-unverified-users/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/server/firebase-admin'; // Gebruik de gecentraliseerde admin export!
import { ONE_DAY_IN_MILLISECONDS } from '@/lib/constants';
import type { UserRecord } from 'firebase-admin/auth';

export async function GET() {
  // Beveilig de route, zodat deze alleen door Vercel's Cron kan worden aangeroepen
  // In productie zou je hier een 'secret' token checken

  try {
    const listUsersResult = await adminAuth.listUsers(1000); // Max 1000 per keer
    const oneDayAgo = Date.now() - ONE_DAY_IN_MILLISECONDS;
    
    const usersToDelete: string[] = [];

    listUsersResult.users.forEach((userRecord: UserRecord) => {
      const creationTime = new Date(userRecord.metadata.creationTime).getTime();
      // Check of gebruiker niet geverifieerd is EN langer dan 24u geleden is aangemaakt
      if (!userRecord.emailVerified && creationTime < oneDayAgo) {
        usersToDelete.push(userRecord.uid);
      }
    });

    if (usersToDelete.length > 0) {
      const deleteResult = await adminAuth.deleteUsers(usersToDelete);
      console.log(`✅ ${deleteResult.successCount} niet-geverifieerde gebruikers verwijderd.`);
      if (deleteResult.failureCount > 0) {
        console.error(`❌ Kon ${deleteResult.failureCount} gebruikers niet verwijderen.`);
        deleteResult.errors.forEach((err) => {
          console.error(`- Fout voor index ${err.index}: ${err.error}`);
        });
      }
    } else {
      console.log('✅ Geen niet-geverifieerde gebruikers gevonden om te verwijderen.');
    }

    return NextResponse.json({ success: true, deletedCount: usersToDelete.length });
  
  } catch (error: any) {
    console.error('❌ Fout tijdens cron job delete-unverified-users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}