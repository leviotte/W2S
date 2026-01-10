// src/modules/backgrounds/backgrounds.server.ts
'use server';
import 'server-only';
import { adminDb, adminStorage } from '@/lib/server/firebase-admin';
import { z } from 'zod';

export const backImageSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  imageLink: z.string().url(),
  isLive: z.boolean(),
  category: z.string().optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['wishlist','event','web']),
});

export async function getWebBackgrounds() {
  const snapshot = await adminDb.collection('WebBackImages').get();
  return snapshot.docs.map(doc => backImageSchema.parse({ id: doc.id, ...doc.data() }));
}

export async function getWebBackgroundCategories() {
  const snapshot = await adminDb.collection('backgroundCategories')
    .where('type', '==', 'web')
    .get();
  return snapshot.docs.map(doc => categorySchema.parse({ id: doc.id, ...doc.data() }));
}

export async function uploadBackgroundImage(
  fileBuffer: Buffer,
  fileName: string,
  title: string,
  category?: string
) {
  // Upload naar Firebase Storage
  const storageRef = adminStorage.bucket().file(`public/WebBackgrounds/${Date.now()}-${fileName}`);
  await storageRef.save(fileBuffer, { contentType: 'image/jpeg', resumable: false });
  const publicUrl = `https://storage.googleapis.com/${storageRef.bucket.name}/${storageRef.name}`;

  // Opslaan in Firestore
  const docRef = await adminDb.collection('WebBackImages').add({
    title,
    imageLink: publicUrl,
    isLive: false,
    category: category || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: docRef.id, title, imageLink: publicUrl, isLive: false, category };
}

export async function deleteBackgroundImage(id: string) {
  const docRef = adminDb.collection('WebBackImages').doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) throw new Error('Afbeelding bestaat niet');

  // TODO: verwijder ook uit Storage als je het pad kent
  await docRef.delete();
}

export async function setLiveBackground(id: string) {
  const batch = adminDb.batch();
  const allImagesSnap = await adminDb.collection('WebBackImages').get();

  allImagesSnap.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { isLive: docSnap.id === id });
  });

  await batch.commit();
}
