// src/app/dashboard/backgrounds/page.tsx
import { adminDb } from '@/lib/server/firebase-admin';
import { BackgroundCategory } from '@/types/background';
import { BackgroundCategoryManager } from './_components/background-category-manager';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/client/firebase';


// Functie om categorieën op te halen. Wordt op de server uitgevoerd.
async function getBackgroundCategories() {
  try {
    const categoriesCollection = collection(getClientFirestore(), "backgroundCategories");
    const q = query(categoriesCollection, orderBy('type'), orderBy('name'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BackgroundCategory[];
  } catch (error) {
    console.error("Failed to fetch background categories:", error);
    return []; // Geef een lege array terug bij een fout
  }
}


export default async function ManageBackgroundsPage() {
  const categories = await getBackgroundCategories();

  return (
    <div className="container mx-auto py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Beheer Achtergronden</h1>
        <p className="text-muted-foreground">
          Voeg categorieën toe of verwijder ze voor de verschillende achtergrondtypes.
        </p>
      </header>
      <main>
        <BackgroundCategoryManager initialCategories={categories} />
      </main>
    </div>
  );
}