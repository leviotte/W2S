// src/lib/auth/actions.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { getSession as getSessionFromCookie } from './session';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';

// ============================================================================
// RE-EXPORTS (voor server components)
// ============================================================================

export { getSession, destroySession } from './session';

// ============================================================================
// HELPER: Get Current User (alleen voor server components)
// ============================================================================

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getSessionFromCookie();
  
  if (!session.user) {
    return null;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(session.user.id).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    
    return {
      ...userData,
      id: session.user.id,
      createdAt: userData?.createdAt?.toDate?.() || new Date(),
      updatedAt: userData?.updatedAt?.toDate?.() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Get current user error:', error);
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
  const user = await requireAuth();
  
  if (!user.isAdmin) {
    redirect('/dashboard');
  }
  
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
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Get managed profiles error:', error);
    return [];
  }
}