// src/lib/auth/actions.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/server/firebase-admin';
import { getUserId, isAdmin as checkIsAdmin } from './session.server';
import type { UserProfile } from '@/types/user';
import { getSession } from './session.server';

/* ============================================================================
 * GET CURRENT USER
 * ========================================================================== */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      id: userId,
      userId,
      email: data.email ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      displayName: data.displayName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
      photoURL: data.photoURL ?? null,
      address: data.address ?? null,
      username: data.username ?? null,
      isAdmin: data.isAdmin ?? false,
      isPartner: data.isPartner ?? false,
      isPublic: data.isPublic ?? false,
      sharedWith: data.sharedWith ?? [],
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  } catch (err) {
    console.error('[Auth] getCurrentUser error:', err);
    return null;
  }
}

/* ============================================================================
 * REQUIRE AUTH
 * ========================================================================== */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect('/?auth=login');
  return user;
}

/* ============================================================================
 * REQUIRE ADMIN
 * ========================================================================== */
export async function requireAdmin(): Promise<UserProfile> {
  const isAdminUser = await checkIsAdmin();
  if (!isAdminUser) redirect('/dashboard');
  const user = await requireAuth();
  return user;
}

/* ============================================================================
 * GET MANAGED PROFILES
 * ========================================================================== */
export async function getManagedProfiles(userId: string) {
  try {
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('userId', '==', userId)
      .get();

    return profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
    }));
  } catch (err) {
    console.error('[Auth] getManagedProfiles error:', err);
    return [];
  }
}
