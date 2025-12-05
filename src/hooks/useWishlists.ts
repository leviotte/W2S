import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { useStore } from '@/lib/store/use-auth-store';

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  price?: number;
}

export interface Wishlist {
  id: string;
  name: string;
  userId: string;
  items: WishlistItem[];
}

export const useWishlists = () => {
  const { currentUser } = useStore();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setWishlists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'wishlists'), where('userId', '==', currentUser.id));
    const unsubscribe = onSnapshot(q, snapshot => {
      setWishlists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wishlist)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  return { wishlists, loading };
};
