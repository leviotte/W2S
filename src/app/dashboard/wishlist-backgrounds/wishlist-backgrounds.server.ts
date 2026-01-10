'use server';

import { z } from "zod";
import { adminDb, adminStorage } from "@/lib/server/firebase-admin"; 

// -----------------------------
// Schemas
// -----------------------------
export const wishlistBackImageSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageLink: z.string().url(),
  isLive: z.boolean(),
  categoryId: z.string().optional(),
});

export const wishlistCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

// -----------------------------
// Server Actions
// -----------------------------
export async function fetchWishlistCategories() {
  const snapshot = await adminDb.collection("WishlistBackCategories").get();
  const categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return z.array(wishlistCategorySchema).parse(categories);
}
// Fetch all images
export async function fetchWishlistBackImages() {
  const snapshot = await adminDb.collection("WishlistBackImages").get();
  const images = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return z.array(wishlistBackImageSchema).parse(images);
}

// Add image
export async function uploadWishlistBackImage(
  fileBuffer: ArrayBuffer | Buffer,
  fileName: string,
  title: string,
  categoryId?: string
) {
  if (!fileBuffer || !title.trim()) throw new Error("File en title zijn verplicht");

  const uniqueFileName = `${Date.now()}-${fileName}`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(`public/WishlistBackImages/${uniqueFileName}`);

  // Converteer ArrayBuffer → Node Buffer
  const nodeBuffer = fileBuffer instanceof ArrayBuffer ? Buffer.from(fileBuffer) : fileBuffer;

  // Upload bestand
  await file.save(nodeBuffer);

  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

  const docRef = await adminDb.collection("WishlistBackImages").add({
    title,
    imageLink: downloadURL,
    isLive: false,
    categoryId: categoryId || null,
  });

  return wishlistBackImageSchema.parse({
    id: docRef.id,
    title,
    imageLink: downloadURL,
    isLive: false,
    categoryId,
  });
}


// Delete image via Admin SDK
export async function deleteWishlistBackImage(id: string) {
  const docRef = adminDb.collection("WishlistBackImages").doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) throw new Error("Afbeelding niet gevonden");

  const data = docSnap.data() as { imageLink: string };

  if (data.imageLink) {
    const filePath = data.imageLink.split(`/${adminStorage.bucket().name}/`)[1] || "";
    if (filePath) {
      const file = adminStorage.bucket().file(filePath);
      try { await file.delete(); } catch (err) { console.warn("Fout bij verwijderen Storage:", err); }
    }
  }

  await docRef.update({ deletedAt: new Date().toISOString() });
}


// Set live
export async function setLiveWishlistBackImage(id: string) {
  const batch = adminDb.batch();
  const imagesSnapshot = await adminDb.collection("WishlistBackImages").get();

  imagesSnapshot.docs.forEach(docSnap => {
    batch.update(adminDb.collection("WishlistBackImages").doc(docSnap.id), {
      isLive: docSnap.id === id
    });
  });

  await batch.commit();
}
