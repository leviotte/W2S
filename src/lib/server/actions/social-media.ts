'use server';

import { adminDb } from '@/lib/server/firebase-admin';
import { revalidateTag } from '@/lib/utils/revalidate';
import type { UpdateSocialMediaInput, SocialPlatform } from '@/types/social-media';
import { requireAdminUser, type AuthUser } from './user-actions';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vul author velden automatisch in van ingelogde admin
 */
function buildAuthor(currentUser: AuthUser) {
  return {
    id: currentUser.id,
    name: currentUser.displayName || currentUser.firstName || 'Admin',
  };
}

// ============================================================================
// UPDATE OR CREATE SOCIAL MEDIA ACCOUNTS
// ============================================================================

export async function updateSocialMediaAccounts(
  input: UpdateSocialMediaInput
): Promise<ActionResult> {
  try {
    const currentUser = await requireAdminUser();

    const accountsRef = adminDb.collection('accounts');
    const snapshot = await accountsRef.limit(1).get();

    const accountData = {
      ...input,
      updatedAt: new Date(),
      author: buildAuthor(currentUser),
    };

    if (!snapshot.empty) {
      // Update existing account
      const docId = snapshot.docs[0].id;
      await accountsRef.doc(docId).set(accountData, { merge: true });
    } else {
      // Create new account
      await accountsRef.add({
        ...accountData,
        createdAt: new Date(),
      });
    }

    revalidateTag('social-media');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error updating social media accounts:', error);
    return { success: false, error: 'Fout bij updaten van social media accounts' };
  }
}

// ============================================================================
// UPDATE SINGLE PLATFORM
// ============================================================================

export async function updateSinglePlatform(
  platform: SocialPlatform,
  url: string | null
): Promise<ActionResult> {
  try {
    const currentUser = await requireAdminUser();

    if (!url || url.trim() === '') {
      return { success: false, error: 'URL is verplicht' };
    }

    const accountsRef = adminDb.collection('accounts');
    const snapshot = await accountsRef.limit(1).get();

    const updateData = {
      [platform]: url.trim(),
      updatedAt: new Date(),
      author: buildAuthor(currentUser),
    };

    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await accountsRef.doc(docId).set(updateData, { merge: true });
    } else {
      await accountsRef.add({
        ...updateData,
        createdAt: new Date(),
      });
    }

    revalidateTag('social-media');

    return { success: true, data: undefined };
  } catch (error) {
    console.error(`Error updating ${platform}:`, error);
    return { success: false, error: `Fout bij updaten van ${platform}` };
  }
}

// ============================================================================
// REMOVE PLATFORM
// ============================================================================

export async function removePlatform(platform: SocialPlatform): Promise<ActionResult> {
  try {
    await requireAdminUser();

    const accountsRef = adminDb.collection('accounts');
    const snapshot = await accountsRef.limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: 'Geen accounts gevonden' };
    }

    const docId = snapshot.docs[0].id;
    await accountsRef.doc(docId).update({
      [platform]: null,
      updatedAt: new Date(),
    });

    revalidateTag('social-media');

    return { success: true, data: undefined };
  } catch (error) {
    console.error(`Error removing ${platform}:`, error);
    return { success: false, error: `Fout bij verwijderen van ${platform}` };
  }
}

// ============================================================================
// REMOVE ALL PLATFORMS
// ============================================================================

export async function removeAllPlatforms(): Promise<ActionResult> {
  try {
    await requireAdminUser();

    const accountsRef = adminDb.collection('accounts');
    const snapshot = await accountsRef.limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: 'Geen accounts gevonden' };
    }

    const docId = snapshot.docs[0].id;
    await accountsRef.doc(docId).set(
      {
        instagram: null,
        facebook: null,
        twitter: null,
        tiktok: null,
        pinterest: null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    revalidateTag('social-media');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error removing all platforms:', error);
    return { success: false, error: 'Fout bij verwijderen van alle accounts' };
  }
}
