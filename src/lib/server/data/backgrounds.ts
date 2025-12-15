import 'server-only';
import { adminDb, adminStorage } from '@/lib/server/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { BackgroundImage, BackgroundCategory, BackgroundType } from '@/types/background';

// ============================================================================
// HELPERS
// ============================================================================

function convertTimestamp(data: any): any {
  if (!data) return data;
  
  const converted: any = { ...data };
  
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    converted.createdAt = data.createdAt.toDate();
  }
  
  return converted;
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Haal categorieën op voor een specifiek type
 */
export async function getBackgroundCategories(
  type: BackgroundType
): Promise<BackgroundCategory[]> {
  try {
    const snapshot = await adminDb
      .collection('backgroundCategories')
      .where('type', '==', type)
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BackgroundCategory[];
  } catch (error) {
    console.error('Error fetching background categories:', error);
    return [];
  }
}

/**
 * Cached versie voor betere performance
 */
export const getCachedBackgroundCategories = cache(
  getBackgroundCategories,
  ['background-categories'],
  {
    tags: ['backgrounds', 'categories'],
    revalidate: 60, // 1 minuut cache
  }
);

// ============================================================================
// IMAGES
// ============================================================================

/**
 * Haal achtergrondafbeeldingen op
 */
export async function getBackgroundImages(
  type: BackgroundType
): Promise<BackgroundImage[]> {
  try {
    const collectionName = `${type.charAt(0).toUpperCase() + type.slice(1)}BackImages`;
    
    const snapshot = await adminDb
      .collection(collectionName)
      .orderBy('title', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BackgroundImage[];
  } catch (error) {
    console.error('Error fetching background images:', error);
    return [];
  }
}

/**
 * Cached versie
 */
export const getCachedBackgroundImages = cache(
  getBackgroundImages,
  ['background-images'],
  {
    tags: ['backgrounds', 'images'],
    revalidate: 30, // 30 seconden cache
  }
);

/**
 * Haal een specifieke achtergrondafbeelding op
 */
export async function getBackgroundImage(
  type: BackgroundType,
  id: string
): Promise<BackgroundImage | null> {
  try {
    const collectionName = `${type.charAt(0).toUpperCase() + type.slice(1)}BackImages`;
    
    const doc = await adminDb
      .collection(collectionName)
      .doc(id)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...convertTimestamp(doc.data()),
    } as BackgroundImage;
  } catch (error) {
    console.error('Error fetching background image:', error);
    return null;
  }
}

// ============================================================================
// COMBINED GETTERS (✅ NIEUW)
// ============================================================================

/**
 * Haal zowel images als categories op voor een type
 * Convenience function voor admin pages
 */
export async function getBackgroundsByType(type: BackgroundType) {
  const [images, categories] = await Promise.all([
    getBackgroundImages(type),
    getBackgroundCategories(type),
  ]);
  
  return { images, categories };
}

/**
 * Cached versie
 */
export const getCachedBackgroundsByType = cache(
  getBackgroundsByType,
  ['backgrounds-by-type'],
  {
    tags: ['backgrounds'],
    revalidate: 60,
  }
);