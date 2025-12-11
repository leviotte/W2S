'use server';

import { revalidateTag } from 'next/cache';
import { adminDb, adminStorage } from '@/lib/server/firebase-admin';
import { requireAuth } from '@/lib/auth/actions';
import type { BackgroundType } from '@/types/background';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Voeg een nieuwe categorie toe
 */
export async function addBackgroundCategory(
  type: BackgroundType,
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    // Auth check (alleen admins kunnen categorieën toevoegen)
    const user = await requireAuth();
    
    if (!name.trim()) {
      return { success: false, error: 'Categorie naam is verplicht' };
    }

    const docRef = await adminDb.collection('backgroundCategories').add({
      name: name.trim(),
      type,
      createdAt: new Date(),
    });

    // Revalidate cache
    revalidateTag('categories', 'default');
    revalidateTag('backgrounds', 'default');

    return {
      success: true,
      data: {
        id: docRef.id,
        name: name.trim(),
      },
    };
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: 'Categorie toevoegen mislukt' };
  }
}

/**
 * Verwijder een categorie
 */
export async function deleteBackgroundCategory(
  categoryId: string
): Promise<ActionResult> {
  try {
    await requireAuth();

    await adminDb.collection('backgroundCategories').doc(categoryId).delete();

    revalidateTag('categories', 'default');
    revalidateTag('backgrounds', 'default');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Categorie verwijderen mislukt' };
  }
}

// ============================================================================
// IMAGES
// ============================================================================

/**
 * Upload achtergrondafbeelding
 * NOTE: File upload moet via FormData gebeuren
 */
export async function uploadBackgroundImage(
  formData: FormData
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requireAuth();

    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const type = formData.get('type') as BackgroundType;
    const file = formData.get('file') as File;

    if (!file || !title || !type) {
      return { success: false, error: 'Ontbrekende velden' };
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const folderName = `${type.charAt(0).toUpperCase() + type.slice(1)}Backgrounds`;
    const filePath = `public/${folderName}/${uniqueFileName}`;

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, // Make publicly accessible
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Save to Firestore
    const collectionName = `${type.charAt(0).toUpperCase() + type.slice(1)}BackImages`;
    const docRef = await adminDb.collection(collectionName).add({
      title,
      imageLink: publicUrl,
      isLive: false,
      category: category || null,
      createdAt: new Date(),
    });

    // Revalidate cache
    revalidateTag('backgrounds', 'default');
    revalidateTag('images', 'default');

    return {
      success: true,
      data: {
        id: docRef.id,
        url: publicUrl,
      },
    };
  } catch (error) {
    console.error('Error uploading background:', error);
    return { success: false, error: 'Upload mislukt' };
  }
}

/**
 * Verwijder achtergrondafbeelding
 */
export async function deleteBackgroundImage(
  type: BackgroundType,
  imageId: string,
  imageUrl: string
): Promise<ActionResult> {
  try {
    await requireAuth();

    const collectionName = `${type.charAt(0).toUpperCase() + type.slice(1)}BackImages`;

    // Delete from Firestore
    await adminDb.collection(collectionName).doc(imageId).delete();

    // Try to delete from Storage (optional - niet blokkeren als het mislukt)
    try {
      const bucket = adminStorage.bucket();
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const folderName = `${type.charAt(0).toUpperCase() + type.slice(1)}Backgrounds`;
        await bucket.file(`public/${folderName}/${fileName}`).delete();
      }
    } catch (storageError) {
      console.warn('Storage deletion failed (non-critical):', storageError);
    }

    revalidateTag('backgrounds', 'default');
    revalidateTag('images', 'default');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting background:', error);
    return { success: false, error: 'Verwijderen mislukt' };
  }
}

/**
 * Toggle live status van achtergrond
 * Als een afbeelding live wordt gezet, worden alle andere automatisch niet-live
 */
export async function toggleBackgroundLive(
  type: BackgroundType,
  imageId: string
): Promise<ActionResult> {
  try {
    await requireAuth();

    const collectionName = `${type.charAt(0).toUpperCase() + type.slice(1)}BackImages`;
    const imageRef = adminDb.collection(collectionName).doc(imageId);
    
    // Get current image
    const imageDoc = await imageRef.get();
    if (!imageDoc.exists) {
      return { success: false, error: 'Afbeelding niet gevonden' };
    }

    const currentIsLive = imageDoc.data()?.isLive || false;
    const newIsLive = !currentIsLive;

    // If setting to live, disable all others first
    if (newIsLive) {
      const batch = adminDb.batch();

      // Set all others to false
      const allImages = await adminDb.collection(collectionName).where('isLive', '==', true).get();
      allImages.docs.forEach((doc) => {
        if (doc.id !== imageId) {
          batch.update(doc.ref, { isLive: false });
        }
      });

      // Set this one to true
      batch.update(imageRef, { isLive: true });

      await batch.commit();
    } else {
      // Just toggle off
      await imageRef.update({ isLive: false });
    }

    revalidateTag('backgrounds', 'default');
    revalidateTag('images', 'default');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error toggling live status:', error);
    return { success: false, error: 'Status wijzigen mislukt' };
  }
}