// src/lib/auth/actions.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { getUserId, isAuthenticated, isAdmin as checkIsAdmin } from './session';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';

// ============================================================================
// RE-EXPORTS (voor server components)
// ============================================================================

export { 
  getSession, 
  destroySession, 
  getUserId, 
  getUserEmail,
  isAuthenticated,
  isAdmin,
  isPartner,
} from './session';

// ============================================================================
// HELPER: Get Current User (alleen voor server components)
// ============================================================================

/**
 * Get volledige user profile uit Firestore
 * ✅ Gebruikt session voor ID, haalt rest uit database
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = await getUserId();
  
  if (!userId) {
    return null;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    
    return {
      ...userData,
      id: userId,
      createdAt: userData?.createdAt?.toDate?.() || new Date(),
      updatedAt: userData?.updatedAt?.toDate?.() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    return null;
  }
}

// ============================================================================
// HELPER: Require Auth (alleen voor server components)
// ============================================================================

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }
  
  return user;
}

// ============================================================================
// HELPER: Require Admin (alleen voor server components)
// ============================================================================

export async function requireAdmin(): Promise<UserProfile> {
  // Check session first (fast)
  const isAdminUser = await checkIsAdmin();
  
  if (!isAdminUser) {
    redirect('/dashboard');
  }
  
  // Get full profile
  const user = await requireAuth();
  
  return user;
}

// ============================================================================
// HELPER: Get Managed Profiles (alleen voor server components)
// ============================================================================

export async function getManagedProfiles(userId: string) {
  try {
    const profilesSnapshot = await adminDb
      .collection('profiles')
      .where('userId', '==', userId)
      .get();
    
    return profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('[Auth] Get managed profiles error:', error);
    return [];
  }
}