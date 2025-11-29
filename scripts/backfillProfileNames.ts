import { collection, getDocs, doc, updateDoc, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

// ⚠️ Gebruik environment variables voor gevoelige Firebase-config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const backfillProfiles = async () => {
  try {
    const profilesRef = collection(db, "profiles");
    const profileSnapshots = await getDocs(profilesRef);

    const updatePromises = profileSnapshots.docs.map(async (docSnapshot) => {
      const profileData = docSnapshot.data();
      const name: string = profileData.name || "";

      // Alleen updaten als name_lower nog niet bestaat
      if (!profileData.name_lower) {
        await updateDoc(doc(db, "profiles", docSnapshot.id), {
          name_lower: name.toLowerCase(),
        });
        console.log(`Updated profile: ${docSnapshot.id}`);
      }
    });

    await Promise.all(updatePromises);
    console.log("Backfill complete!");
  } catch (error) {
    console.error("Error during backfill:", error);
  }
};

// Alleen lokaal of via node script uitvoeren, niet via route
if (require.main === module) {
  backfillProfiles();
}

export default backfillProfiles;
