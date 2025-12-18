// src/lib/server/actions/follow-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/user';

type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// FOLLOW USER OR PROFILE (NIEUWE FUNCTIE - MERGED UIT OUDE CODE)
// ============================================================================

export async function followUserOrProfileAction(
  currentUserUid: string,
  followTargetId: string,
  isTargetProfile: boolean,
  isCurrentUserProfile: boolean
): Promise<ActionResult<void>> {
  try {
    const currentUserType = isCurrentUserProfile ? 'profiles' : 'users';
    const targetType = isTargetProfile ? 'profiles' : 'users';

    const batch = adminDb.batch();

    // Add to current user's following
    const followingRef = adminDb
      .collection(currentUserType)
      .doc(currentUserUid)
      .collection('following')
      .doc(followTargetId);

    // Add to target's followers
    const followerRef = adminDb
      .collection(targetType)
      .doc(followTargetId)
      .collection('followers')
      .doc(currentUserUid);

    batch.set(followingRef, {
      createdAt: new Date().toISOString(),
      type: targetType,
    });

    batch.set(followerRef, {
      createdAt: new Date().toISOString(),
      type: currentUserType,
    });

    await batch.commit();

    revalidatePath('/profile');
    revalidatePath('/search');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error following user or profile:', error);
    return { success: false, error: 'Kon niet volgen' };
  }
}

// ============================================================================
// UNFOLLOW USER OR PROFILE (NIEUWE FUNCTIE - MERGED UIT OUDE CODE)
// ============================================================================

export async function unfollowUserOrProfileAction(
  currentUserUid: string,
  followTargetId: string,
  isTargetProfile: boolean,
  isCurrentUserProfile: boolean
): Promise<ActionResult<void>> {
  try {
    const currentUserType = isCurrentUserProfile ? 'profiles' : 'users';
    const targetType = isTargetProfile ? 'profiles' : 'users';

    const batch = adminDb.batch();

    const followingRef = adminDb
      .collection(currentUserType)
      .doc(currentUserUid)
      .collection('following')
      .doc(followTargetId);

    const followerRef = adminDb
      .collection(targetType)
      .doc(followTargetId)
      .collection('followers')
      .doc(currentUserUid);

    batch.delete(followingRef);
    batch.delete(followerRef);

    await batch.commit();

    revalidatePath('/profile');
    revalidatePath('/search');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error unfollowing user or profile:', error);
    return { success: false, error: 'Kon niet ontvolgen' };
  }
}

// ============================================================================
// GET FOLLOWERS (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function getFollowersAction(userId: string): Promise<ActionResult<UserProfile[]>> {
  try {
    const followersSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('followers')
      .get();

    const followers: UserProfile[] = [];
    
    for (const doc of followersSnapshot.docs) {
      const followerDoc = await adminDb.collection('users').doc(doc.id).get();
      if (followerDoc.exists) {
        followers.push({ id: followerDoc.id, ...followerDoc.data() } as UserProfile);
      }
    }

    return { success: true, data: followers };
  } catch (error) {
    console.error('Error fetching followers:', error);
    return { success: false, error: 'Kon volgers niet ophalen' };
  }
}

// ============================================================================
// GET FOLLOWING (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function getFollowingAction(userId: string): Promise<ActionResult<UserProfile[]>> {
  try {
    const followingSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('following')
      .get();

    const following: UserProfile[] = [];
    
    for (const doc of followingSnapshot.docs) {
      const followingDoc = await adminDb.collection('users').doc(doc.id).get();
      if (followingDoc.exists) {
        following.push({ id: followingDoc.id, ...followingDoc.data() } as UserProfile);
      }
    }

    return { success: true, data: following };
  } catch (error) {
    console.error('Error fetching following:', error);
    return { success: false, error: 'Kon volgend niet ophalen' };
  }
}

// ============================================================================
// FOLLOW USER (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function followUserAction(
  followerId: string,
  targetId: string
): Promise<ActionResult<void>> {
  try {
    const batch = adminDb.batch();

    const followingRef = adminDb
      .collection('users')
      .doc(followerId)
      .collection('following')
      .doc(targetId);

    const followerRef = adminDb
      .collection('users')
      .doc(targetId)
      .collection('followers')
      .doc(followerId);

    batch.set(followingRef, { 
      createdAt: new Date().toISOString(),
      type: 'users'
    });
    
    batch.set(followerRef, { 
      createdAt: new Date().toISOString(),
      type: 'users'
    });

    await batch.commit();

    revalidatePath('/profile');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: 'Kon gebruiker niet volgen' };
  }
}

// ============================================================================
// UNFOLLOW USER (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function unfollowUserAction(
  followerId: string,
  targetId: string
): Promise<ActionResult<void>> {
  try {
    const batch = adminDb.batch();

    const followingRef = adminDb
      .collection('users')
      .doc(followerId)
      .collection('following')
      .doc(targetId);

    const followerRef = adminDb
      .collection('users')
      .doc(targetId)
      .collection('followers')
      .doc(followerId);

    batch.delete(followingRef);
    batch.delete(followerRef);

    await batch.commit();

    revalidatePath('/profile');
    
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: 'Kon gebruiker niet ontvolgen' };
  }
}

// ============================================================================
// CHECK IF FOLLOWING (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function isFollowingAction(
  followerId: string,
  targetId: string
): Promise<ActionResult<boolean>> {
  try {
    const doc = await adminDb
      .collection('users')
      .doc(followerId)
      .collection('following')
      .doc(targetId)
      .get();

    return { success: true, data: doc.exists };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: 'Kon status niet controleren' };
  }
}

// ============================================================================
// GET FOLLOW COUNTS (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function getFollowCountsAction(userId: string): Promise<ActionResult<{
  followersCount: number;
  followingCount: number;
}>> {
  try {
    const [followersSnap, followingSnap] = await Promise.all([
      adminDb.collection('users').doc(userId).collection('followers').get(),
      adminDb.collection('users').doc(userId).collection('following').get(),
    ]);

    return {
      success: true,
      data: {
        followersCount: followersSnap.size,
        followingCount: followingSnap.size,
      },
    };
  } catch (error) {
    console.error('Error getting follow counts:', error);
    return { success: false, error: 'Kon tellingen niet ophalen' };
  }
}

// ============================================================================
// GET FOLLOW STATS (BESTAAND - BLIJFT HETZELFDE)
// ============================================================================

export async function getFollowStatsAction(userId: string): Promise<{
  followers: UserProfile[];
  following: UserProfile[];
  followersCount: number;
  followingCount: number;
}> {
  try {
    const [followersResult, followingResult] = await Promise.all([
      getFollowersAction(userId),
      getFollowingAction(userId),
    ]);

    const followers = followersResult.success ? followersResult.data : [];
    const following = followingResult.success ? followingResult.data : [];

    return {
      followers,
      following,
      followersCount: followers.length,
      followingCount: following.length,
    };
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return {
      followers: [],
      following: [],
      followersCount: 0,
      followingCount: 0,
    };
  }
}