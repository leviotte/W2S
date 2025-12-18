// src/lib/utils/followActions.ts
import { doc, collection, setDoc, deleteDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/client/firebase";

/**
 * Follow a user or profile
 */
export async function followUserOrProfile(
  currentUserUid: string,
  followTargetId: string,
  isTargetProfile: boolean,
  isCurrentUserProfile: boolean
): Promise<void> {
  try {
    const currentUserType = isCurrentUserProfile ? "profiles" : "users";
    const targetType = isTargetProfile ? "profiles" : "users";

    const followingRef = doc(
      collection(db, `${currentUserType}/${currentUserUid}/following`),
      followTargetId
    );
    const followerRef = doc(
      collection(db, `${targetType}/${followTargetId}/followers`),
      currentUserUid
    );

    await setDoc(followingRef, {
      createdAt: Timestamp.now(),
      type: targetType,
    });
    await setDoc(followerRef, {
      createdAt: Timestamp.now(),
      type: currentUserType,
    });
  } catch (error) {
    console.error("Error following user or profile:", error);
    throw error;
  }
}

/**
 * Unfollow a user or profile
 */
export async function unfollowUserOrProfile(
  currentUserUid: string,
  followTargetId: string,
  isTargetProfile: boolean,
  isCurrentUserProfile: boolean
): Promise<void> {
  try {
    const currentUserType = isCurrentUserProfile ? "profiles" : "users";
    const targetType = isTargetProfile ? "profiles" : "users";

    const followingRef = doc(
      collection(db, `${currentUserType}/${currentUserUid}/following`),
      followTargetId
    );
    const followerRef = doc(
      collection(db, `${targetType}/${followTargetId}/followers`),
      currentUserUid
    );

    await deleteDoc(followingRef);
    await deleteDoc(followerRef);
  } catch (error) {
    console.error("Error unfollowing user or profile:", error);
    throw error;
  }
}

/**
 * Realtime listener for followers or following
 */
export function setupRealtimeListener(
  uid: string,
  isProfile: boolean,
  type: "followers" | "following",
  callback: (data: Array<{ id: string; [key: string]: any }>) => void
) {
  const collectionPath = isProfile
    ? `profiles/${uid}/${type}`
    : `users/${uid}/${type}`;

  const unsubscribe = onSnapshot(collection(db, collectionPath), (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });

  return unsubscribe; // Call unsubscribe() to stop listening
}
