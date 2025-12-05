/**
 * Dit script vult de 'name_lower' velden in voor bestaande profielen.
 *
 * BELANGRIJK:
 * Dit script maakt direct verbinding met je Firestore database. Maak altijd eerst een backup
 * van je data voordat je dit soort bulk-updates uitvoert in een productie-omgeving.
 *
 * Draai lokaal met:
 *   npm run db:backfill-names
 */

// Stap 1: Laad environment variabelen uit .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' }); // Pas het pad aan naar de root van je project

// Stap 2: Importeer de Firestore instance via onze singleton-functie
import { getAdminFirestore } from '@/lib/server/firebaseAdmin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

async function runBackfill() {
  console.log('--- Starting profile backfill script ---');
  try {
    // Haal de geïnitialiseerde Firestore instance op
    const db = getAdminFirestore();
    const profilesRef = db.collection('profiles');
    const snapshot = await profilesRef.get();

    if (snapshot.empty) {
      console.log('✅ Geen profielen gevonden om te updaten.');
      return;
    }

    const batch = db.batch();
    let updatesCount = 0;

    // Expliciet type voor 'doc'
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const name = data.name || '';

      // Controleer of 'name_lower' niet bestaat of incorrect is
      if (data.name_lower !== name.toLowerCase()) {
        console.log(`➡️  Update gepland voor profiel ${doc.id} (Naam: "${name}")`);
        batch.update(doc.ref, { name_lower: name.toLowerCase() });
        updatesCount++;
      }
    });

    if (updatesCount === 0) {
      console.log("✅ Alle profielen hebben al een correct 'name_lower' veld. Geen updates nodig.");
      return;
    }

    // Voer alle updates uit in één atomaire batch-operatie
    await batch.commit();
    console.log(`🚀 Succesvol ${updatesCount} profielen bijgewerkt in een batch.`);

  } catch (err) {
    console.error('❌ Fout tijdens het backfill script:', err);
    process.exitCode = 1; // Geef aan dat het script is mislukt
  } finally {
    console.log('--- Script voltooid ---');
  }
}

// Draai het script
runBackfill();