// src/lib/auth/actions.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { getUserId, isAdmin as checkIsAdmin } from './session';
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
// ✅ GET CURRENT USER - STATE-OF-THE-ART
// ============================================================================

/**
 * ✅ Haalt volledige user profile uit Firestore
 * 💡 Return type: UserProfile | null
 * 🚀 Inclusief alle velden (firstName, lastName, displayName, photoURL, etc.)
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = await getUserId();
  
  if (!userId) {
    return null;
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.warn(`[Auth] User document not found for ID: ${userId}`);
      return null;
    }

    const userData = userDoc.data();
    
    if (!userData) {
      console.warn(`[Auth] User document exists but has no data: ${userId}`);
      return null;
    }

    // ✅ VOLLEDIGE UserProfile met alle velden
    const userProfile: UserProfile = {
      id: userId,
      userId: userId, // Backward compatibility
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      
      // Optional fields
      photoURL: userData.photoURL || null,
      address: userData.address || null,
      birthdate: userData.birthdate || null,
      gender: userData.gender || null,
      username: userData.username || null,
      phone: userData.phone || null,
      socials: userData.socials || null,
      
      // Permissions
      isPublic: userData.isPublic ?? false,
      isAdmin: userData.isAdmin ?? false,
      isPartner: userData.isPartner ?? false,
      sharedWith: userData.sharedWith || [],
      
      // Timestamps (Firestore Timestamp → Date)
      createdAt: userData.createdAt?.toDate?.() || new Date(),
      updatedAt: userData.updatedAt?.toDate?.() || new Date(),
    };

    return userProfile;
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    return null;
  }
}

// ============================================================================
// HELPER: Require Auth
// ============================================================================

/**
 * ✅ Redirect naar login als niet ingelogd
 * 💡 Gebruik in page.tsx: const user = await requireAuth();
 */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/?modal=login');
  }
  
  return user;
}

// ============================================================================
// HELPER: Require Admin
// ============================================================================

/**
 * ✅ Redirect naar dashboard als niet admin
 */
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
// HELPER: Get Managed Profiles
// ============================================================================

/**
 * ✅ Haal alle sub-profielen op die deze user beheert
 */
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
    console.error('[Auth] Get managed profiles error:', error);
    return [];
  }
}