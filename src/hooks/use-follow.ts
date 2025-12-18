// src/hooks/use-follow.ts
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';

interface FollowData {
  id: string;
  createdAt: string;
  type: string;
}

/**
 * Realtime listener voor followers/following
 * Dit is CLIENT-SIDE omdat het onSnapshot gebruikt
 */
export function useFollowListener(
  uid: string,
  isProfile: boolean,
  type: 'followers' | 'following'
) {
  const [data, setData] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const collectionPath = isProfile  // ✅ TYPO FIX: was "collecti"
      ? `profiles/${uid}/${type}`
      : `users/${uid}/${type}`;

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        const followData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FollowData[];
        
        setData(followData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error in ${type} listener:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, isProfile, type]);

  return { data, loading, error };
}

/**
 * Legacy functie voor backwards compatibility
 */
export function setupRealtimeListener(
  uid: string,
  isProfile: boolean,
  type: 'followers' | 'following',
  callback: (data: FollowData[]) => void
) {
  const collectionPath = isProfile  // ✅ TYPO FIX: was "collecti"
    ? `profiles/${uid}/${type}`
    : `users/${uid}/${type}`;

  const unsubscribe = onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FollowData[];
      callback(data);
    }
  );

  return unsubscribe;
}