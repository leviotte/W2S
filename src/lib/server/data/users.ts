import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin';
import { userProfileSchema, type UserProfile } from '@/types/user';
import { unstable_cache as cache } from 'next/cache';
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type UserWithId = UserProfile & { id: string };

export type PaginationOptions = {
  limit?: number;
  startAfter?: string; // User ID to start after
};

export type PaginatedUsers = {
  users: UserWithId[];
  hasMore: boolean;
  lastUserId?: string;
};

// ============================================================================
// HELPERS (Private)
// ============================================================================

/**
 * Private helper om Firestore docs consistent te verwerken en te valideren
 * BEST PRACTICE: Centraliseer validatie logica
 */
const processAndValidateDoc = (
  doc: DocumentSnapshot | QueryDocumentSnapshot,
  context: string
): UserWithId | null => {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  // Converteer Firestore Timestamps naar JS Dates voor Zod validatie
  const processedData = {
    ...data,
    id: doc.id,
    // Zorg dat Timestamps correct worden geconverteerd
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    birthdate: data.birthdate?.toDate?.() || data.birthdate,
  };

  const parsed = userProfileSchema.safeParse(processedData);
  
  if (!parsed.success) {
    console.error(
      `[${context}] Validation failed for doc ${doc.id}:`,
      parsed.error.flatten()
    );
    return null;
  }
  
  return parsed.data as UserWithId;
};

/**
 * Type guard om null values uit arrays te filteren
 */
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

// ============================================================================
// PUBLIC API - INDIVIDUAL USERS
// ============================================================================

/**
 * Haalt een user profiel op uit Firestore op basis van ID
 * CACHED: 1 uur, met userId-specifieke tag voor targeted revalidation
 */
export const getUserProfileById = cache(
  async (userId: string): Promise<UserWithId | null> => {
    if (!userId || typeof userId !== 'string') return null;
    
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      return processAndValidateDoc(userDoc, 'getUserProfileById');
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
      return null;
    }
  },
  ['user-profile'],
  {
    tags: (userId: string) => ['users', `user-${userId}`],
    revalidate: 3600, // 1 uur
  }
);

/**
 * Zoekt een gebruiker op basis van e-mailadres
 * CACHED: 1 uur
 */
export const findUserByEmail = cache(
  async (email: string): Promise<UserWithId | null> => {
    if (!email || typeof email !== 'string') return null;
    
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const snapshot = await adminDb
        .collection('users')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      return processAndValidateDoc(snapshot.docs[0], 'findUserByEmail');
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      return null;
    }
  },
  ['user-by-email'],
  {
    tags: ['users'],
    revalidate: 3600,
  }
);

/**
 * Haalt een profiel op basis van de unieke username
 * CACHED: 1 uur
 */
export const getProfileByUsername = cache(
  async (username: string): Promise<UserWithId | null> => {
    if (!username || typeof username !== 'string') return null;
    
    const normalizedUsername = username.toLowerCase().trim();
    
    try {
      const snapshot = await adminDb
        .collection('users')
        .where('username', '==', normalizedUsername)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      return processAndValidateDoc(snapshot.docs[0], 'getProfileByUsername');
    } catch (error) {
      console.error(`Error fetching profile by username: ${username}`, error);
      return null;
    }
  },
  ['user-by-username'],
  {
    tags: ['users'],
    revalidate: 3600,
  }
);

// ============================================================================
// PUBLIC API - RELATIONSHIPS
// ============================================================================

/**
 * Haalt de beheerde sub-profielen op voor een gegeven manager/owner
 * CACHED: 5 minuten
 */
export const getManagedProfiles = cache(
  async (managerId: string): Promise<UserWithId[]> => {
    if (!managerId || typeof managerId !== 'string') return [];
    
    try {
      const snapshot = await adminDb
        .collection('profiles') // ✅ Sub-profiles in aparte collection
        .where('userId', '==', managerId)
        .get();
      
      if (snapshot.empty) return [];
      
      return snapshot.docs
        .map(doc => processAndValidateDoc(doc, 'getManagedProfiles'))
        .filter(isNotNull);
    } catch (error) {
      console.error(`Error fetching managed profiles for ${managerId}:`, error);
      return [];
    }
  },
  ['managed-profiles'],
  {
    tags: (managerId: string) => ['users', 'profiles', `user-${managerId}-profiles`],
    revalidate: 300, // 5 minuten
  }
);

/**
 * Haalt de profielen van meerdere managers op
 * NOT CACHED: Gebruikt individueel gecachte getUserProfileById calls
 */
export async function getProfileManagers(managerIds: string[]): Promise<UserWithId[]> {
  if (!managerIds || managerIds.length === 0) return [];
  
  try {
    const managerPromises = managerIds.map(id => getUserProfileById(id));
    const managers = await Promise.all(managerPromises);
    return managers.filter(isNotNull);
  } catch (error) {
    console.error('Error fetching profile managers:', error);
    return [];
  }
}

/**
 * Haalt het aantal volgers en volgend op voor een gebruiker
 * CACHED: 5 minuten (social data verandert frequenter)
 */
export const getFollowCounts = cache(
  async (userId: string): Promise<{ followers: number; following: number }> => {
    if (!userId || typeof userId !== 'string') {
      return { followers: 0, following: 0 };
    }
    
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return { followers: 0, following: 0 };
      }
      
      const userData = userDoc.data();
      const followersCount = Array.isArray(userData?.followers) 
        ? userData.followers.length 
        : 0;
      const followingCount = Array.isArray(userData?.following) 
        ? userData.following.length 
        : 0;

      return { 
        followers: followersCount, 
        following: followingCount 
      };
    } catch (error) {
      console.error(`Error fetching follow counts for user ${userId}:`, error);
      return { followers: 0, following: 0 };
    }
  },
  ['follow-counts'],
  {
    tags: (userId: string) => ['users', `user-${userId}-follows`],
    revalidate: 300, // 5 minuten
  }
);

// ============================================================================
// PUBLIC API - COLLECTIONS (Admin/Search)
// ============================================================================

/**
 * Haalt alle user profielen op uit Firestore (PAGINATED)
 * BEST PRACTICE: Gebruik paginatie voor grote datasets
 * CACHED: 10 minuten
 */
export const getUsers = cache(
  async (options: PaginationOptions = {}): Promise<PaginatedUsers> => {
    const { limit = 50, startAfter } = options;
    
    try {
      let query = adminDb
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit + 1); // +1 om te checken of er meer zijn
      
      // Start na specifieke user (voor paginatie)
      if (startAfter) {
        const startDoc = await adminDb.collection('users').doc(startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return { users: [], hasMore: false };
      }

      const allDocs = snapshot.docs
        .map(doc => processAndValidateDoc(doc, 'getUsers'))
        .filter(isNotNull);
      
      // Check of er meer resultaten zijn
      const hasMore = allDocs.length > limit;
      const users = hasMore ? allDocs.slice(0, limit) : allDocs;
      const lastUserId = users.length > 0 ? users[users.length - 1].id : undefined;
      
      return { users, hasMore, lastUserId };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { users: [], hasMore: false };
    }
  },
  ['all-users'],
  {
    tags: ['users'],
    revalidate: 600, // 10 minuten
  }
);

/**
 * Haalt ALLE gebruikers op zonder paginatie
 * ⚠️ GEBRUIK VOORZICHTIG: Alleen voor admin exports/backups
 * NOT CACHED: Altijd fresh data
 */
export async function getAllUsersUnpaginated(): Promise<UserWithId[]> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (snapshot.empty) return [];

    return snapshot.docs
      .map(doc => processAndValidateDoc(doc, 'getAllUsersUnpaginated'))
      .filter(isNotNull);
  } catch (error) {
    console.error('Error fetching all users (unpaginated):', error);
    return [];
  }
}

/**
 * Zoek gebruikers op naam/email (voor admin search)
 * BEST PRACTICE: Voor production gebruik Algolia/Typesense
 * NOT CACHED: Search queries zijn dynamisch
 */
export async function searchUsers(query: string, limit = 20): Promise<UserWithId[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  try {
    // OPMERKING: Firestore heeft geen full-text search
    // Voor production: Gebruik Algolia, Typesense of Elasticsearch
    // Dit is een fallback oplossing die client-side filtert
    
    const snapshot = await adminDb
      .collection('users')
      .limit(500) // Limiteer hoeveel we ophalen voor filtering
      .get();

    if (snapshot.empty) return [];

    const allUsers = snapshot.docs
      .map(doc => processAndValidateDoc(doc, 'searchUsers'))
      .filter(isNotNull);

    // Client-side filtering (niet ideaal voor productie!)
    const filtered = allUsers.filter(user => {
      const searchableFields = [
        user.firstName,
        user.lastName,
        user.displayName,
        user.email,
        user.username,
      ]
        .filter(Boolean)
        .map(field => field?.toLowerCase());

      return searchableFields.some(field => 
        field?.includes(searchTerm)
      );
    });

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Haal gebruikers op die recent zijn toegevoegd
 * CACHED: 5 minuten
 */
export const getRecentUsers = cache(
  async (limit = 10): Promise<UserWithId[]> => {
    try {
      const snapshot = await adminDb
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      if (snapshot.empty) return [];

      return snapshot.docs
        .map(doc => processAndValidateDoc(doc, 'getRecentUsers'))
        .filter(isNotNull);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      return [];
    }
  },
  ['recent-users'],
  {
    tags: ['users'],
    revalidate: 300, // 5 minuten
  }
);

// ============================================================================
// CACHE REVALIDATION HELPERS
// ============================================================================

/**
 * Helper om user-gerelateerde cache te invalideren
 * GEBRUIK: Na user updates, volg acties, etc.
 */
export function revalidateUserCache(userId: string) {
  // Deze functie kun je gebruiken met revalidateTag() in server actions
  return [`user-${userId}`, `user-${userId}-follows`, `user-${userId}-profiles`];
}