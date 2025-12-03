/**
 * Dit script vult de 'name_lower' velden in voor bestaande profielen.
 * Draai lokaal met:
 *   npx ts-node --project tsconfig.node.json scripts/backfillProfileNames.ts
 *
 * Zorg ervoor dat de FIREBASE environment variabelen correct zijn ingesteld in je .env.local file.
 */

// Forceer de 'development' environment voor ts-node zodat .env.local wordt geladen
process.env.NODE_ENV = 'development'; 

import { db } from '../lib/server/firebaseAdmin';

async function runBackfill() {
  console.log('Starting profile backfill script...');
  try {
    // De 'db' wordt direct geïmporteerd en is al geïnitialiseerd.
    const profilesRef = db.collection('profiles');
    const snapshot = await profilesRef.get();

    if (snapshot.empty) {
      console.log('No profiles found to update.');
      return;
    }

    const updates: Promise<FirebaseFirestore.WriteResult>[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const name = data.name || '';

      // Controleer of 'name_lower' niet bestaat of leeg is
      if (!data.name_lower) {
        console.log(`Queueing update for profile ${doc.id} (Name: "${name}")`);
        updates.push(
          profilesRef.doc(doc.id).update({
            name_lower: name.toLowerCase(),
          })
        );
      }
    });

    if (updates.length === 0) {
        console.log("All profiles already have 'name_lower'. No updates needed.");
        return;
    }

    await Promise.all(updates);
    console.log(`Successfully updated ${updates.length} profiles.`);

  } catch (err) {
    console.error('Backfill script failed:', err);
    process.exitCode = 1; // Geef aan dat het script is mislukt
  }
}

// Draai het script
runBackfill();