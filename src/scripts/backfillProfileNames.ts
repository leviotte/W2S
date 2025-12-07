/**
 * src/scripts/backfillProfileNames.ts
 *
 * Vult een doorzoekbaar 'displayName_lower' veld in voor bestaande gebruikers.
 * Dit script is geüpdatet naar de 'gold standard' architectuur van ons project.
 *
 * BELANGRIJK:
 * Maak altijd een backup van je data voordat je dit soort bulk-updates uitvoert.
 *
 * Draai lokaal met:
 *   npm run db:backfill-names
 */

// Stap 1: Laad environment variabelen uit .env.local
import * as dotenv from 'dotenv';
// Het pad is correct, want het script draait vanuit de root dankzij `ts-node`.
dotenv.config({ path: '.env.local' }); 

// Stap 2: Importeer de DIRECTE adminDb instance uit onze centrale firebaseAdmin module
import { adminDb } from '../lib/server/firebase-admin'; // Pad aangepast voor scriptlocatie
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

async function runBackfill() {
  console.log("--- Starten van het 'displayName_lower' backfill script ---");
  try {
    // MENTOR-VERBETERING: Gebruik de consistente 'users' collectienaam
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('✅ Geen gebruikers gevonden om te updaten.');
      return;
    }

    const batch = adminDb.batch();
    let updatesCount = 0;

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      
      // MENTOR-VERBETERING: Logica aangepast aan ons UserProfile schema
      const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      const displayNameLower = displayName.toLowerCase();

      // Controleer of displayName en displayName_lower niet bestaan of incorrect zijn
      if (data.displayName !== displayName || data.displayName_lower !== displayNameLower) {
        console.log(`➡️  Update gepland voor gebruiker ${doc.id} (Naam: "${displayName}")`);
        batch.update(doc.ref, { 
          displayName: displayName,
          displayName_lower: displayNameLower 
        });
        updatesCount++;
      }
    });

    if (updatesCount === 0) {
      console.log("✅ Alle gebruikers hebben al een correct 'displayName' en 'displayName_lower' veld. Geen updates nodig.");
      return;
    }

    // Voer alle updates uit in één atomaire batch-operatie
    await batch.commit();
    console.log(`🚀 Succesvol ${updatesCount} gebruikersprofielen bijgewerkt.`);

  } catch (err) {
    console.error('❌ Fout tijdens het backfill script:', err);
    process.exitCode = 1; 
  } finally {
    console.log('--- Script voltooid ---');
  }
}

// Draai het script
runBackfill();