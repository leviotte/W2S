// src/modules/dashboard/backgrounds.actions.server.ts
'use server';

import { adminDb, adminStorage } from "@/lib/server/firebase-admin";
import { BackgroundUploadData, backgroundCategorySchema, backgroundImageSchema, BackgroundCategory, BackgroundImage } from "./backgrounds.types";
import { z } from "zod";
import type { BackgroundType } from "./backgrounds.types";

// -------------------------
// CATEGORIES
// -------------------------

export async function getCategories(type: "event" | "wishlist" | "web"): Promise<BackgroundCategory[]> {
  const snapshot = await adminDb.collection("backgroundCategories").where("type", "==", type).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return backgroundCategorySchema.parse({ id: doc.id, ...data, createdAt: data.createdAt?.toDate?.() });
  });
}

export async function addCategory(name: string, type: BackgroundType) {
  const docRef = await adminDb.collection("backgroundCategories").add({
    name,
    type,
    createdAt: new Date(),
  });

  return backgroundCategorySchema.parse({
    id: docRef.id,
    name,
    type,
    createdAt: new Date(),
  });
}

// -------------------------
// BACKGROUND IMAGES
// -------------------------

export async function getBackgroundImages(filterCategoryId?: string): Promise<BackgroundImage[]> {
  let query = adminDb.collection("EventBackImages").orderBy("createdAt", "desc");
  if (filterCategoryId) {
    query = query.where("category", "==", filterCategoryId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return backgroundImageSchema.parse({
      id: doc.id,
      title: data.title,
      imageLink: data.imageLink,
      category: data.category,
      isLive: data.isLive ?? true,
      createdAt: data.createdAt?.toDate?.(),
    });
  });
}

export async function deleteBackgroundImage(id: string): Promise<void> {
  const docRef = adminDb.collection("EventBackImages").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) throw new Error("Image not found");

  const data = docSnap.data();
  if (data?.imageLink) {
    // Delete file from storage
    try {
      const filePath = new URL(data.imageLink).pathname.slice(1); // Remove leading slash
      await adminStorage.bucket().file(filePath).delete();
    } catch (err) {
      console.warn("Failed to delete image from Storage:", err);
    }
  }

  await docRef.delete();
}

export async function uploadBackgroundImage(data: BackgroundUploadData): Promise<BackgroundImage> {
  if (!data.file) throw new Error("No file provided");

  // Zod validation
  const parsed = z.object({ title: z.string().min(1), category: z.string().min(1) }).parse({ title: data.title, category: data.category });

  // Generate unique filename
  const uniqueFileName = `public/eventBackgrounds/${Date.now()}-${data.file.name}`;

  // Upload to Firebase Storage
  const bucket = adminStorage.bucket();
  const file = bucket.file(uniqueFileName);
  await file.save(Buffer.from(await data.file.arrayBuffer()), {
    contentType: data.file.type,
    resumable: false,
  });

  // Get public URL
  const [url] = await file.getSignedUrl({ action: "read", expires: "03-01-2500" });

  // Save to Firestore
  const docRef = await adminDb.collection("EventBackImages").add({
    title: parsed.title,
    category: parsed.category,
    imageLink: url,
    isLive: true,
    createdAt: new Date(),
  });

  return backgroundImageSchema.parse({
    id: docRef.id,
    title: parsed.title,
    category: parsed.category,
    imageLink: url,
    isLive: true,
    createdAt: new Date(),
  });
}
