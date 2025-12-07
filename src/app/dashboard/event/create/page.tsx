import { collection, getDocs } from "firebase/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { CreateEventForm } from "./_components/CreateEventForm"; // We importeren ons nieuwe client component

// Definieer de types hier of in een apart types-bestand
interface BackImage {
  id: string;
  imageLink: string;
  title: string;
  category: string;
}

interface Category {
  id:string;
  name: string;
  type: string;
}

// Deze functie runt op de server!
async function getEventCreationData() {
  const categoryCollectionRef = adminDb.collection("backgroundCategories");
  const imageCollectionRef = adminDb.collection("EventBackImages");

  const [categorySnap, imageSnap] = await Promise.all([
    categoryCollectionRef.where("type", "==", "event").get(),
    imageCollectionRef.get(),
  ]);

  const categories = categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
  const backImages = imageSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BackImage[];

  return { categories, backImages };
}

export default async function CreateEventPage() {
  // We halen de data op de server op
  const { categories, backImages } = await getEventCreationData();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 border">
        <h1 className="text-2xl font-bold text-accent mb-6">Nieuw evenement</h1>
        {/* We renderen het client-component met de data als props */}
        <CreateEventForm categories={categories} backImages={backImages} />
      </div>
    </div>
  );
}