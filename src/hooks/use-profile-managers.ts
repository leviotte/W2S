"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { db } from '@/lib/client/firebase';
import { collection, query, where, getDocs, limit, onSnapshot, doc, DocumentData } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { Manager, UserProfile } from '@/types/user';
import { toast } from 'sonner';

// Helper om documentdata veilig om te zetten naar het Manager-type
// DE FIX ZIT HIER: We voegen de verplichte velden toe.
function docToManager(doc: DocumentData): Manager {
    const data = doc.data() as Partial<UserProfile>; // Type cast voor betere autocompletion
    return {
        id: doc.id,
        email: data.email ?? '',
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        photoURL: data.photoURL ?? null,
        isPublic: data.isPublic ?? false, // VERPLICHT VELD
        isAdmin: data.isAdmin ?? false,   // VERPLICHT VELD
        // We kunnen de andere optionele velden ook toevoegen voor volledigheid
        username: data.username,
        birthdate: data.birthdate,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
    };
}


export function useProfileManagers(profileId: string) {
  const { currentUser, addManagerToProfile, removeManagerFromProfile } = useAuthStore();
  
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manager[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Effect om real-time updates voor beheerders te ontvangen
  useEffect(() => {
    if (!profileId) return;

    const profileRef = doc(db, 'profiles', profileId);
    const unsubscribe = onSnapshot(profileRef, async (profileSnap) => {
        if (!profileSnap.exists()) {
            setManagers([]);
            setIsLoading(false);
            return;
        }
        
        const managerIds = profileSnap.data()?.managers || [];
        if (managerIds.length === 0) {
            setManagers([]);
            setIsLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            // 'in' queries zijn gelimiteerd tot 30 waardes, voor grotere groepen is een andere aanpak nodig
            const q = query(usersRef, where('__name__', 'in', managerIds.slice(0, 30)));
            
            const querySnapshot = await getDocs(q);
            const managersData = querySnapshot.docs.map(docToManager);
            setManagers(managersData);
        } catch (error) {
            console.error("Error fetching managers:", error);
            toast.error("Kon beheerders niet laden.");
        } finally {
            setIsLoading(false);
        }
    }, (error) => {
        console.error("Error listening to profile updates:", error);
        toast.error("Fout bij het laden van profielupdates.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profileId]);


  // Effect voor het zoeken naar gebruikers om als beheerder toe te voegen
  useEffect(() => {
    if (debouncedSearchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      if (!currentUser?.id) return;
      setIsSearching(true);
      try {
        const usersRef = collection(db, 'users');
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        
        const emailQuery = query(
          usersRef,
          where('email', '>=', lowerCaseQuery),
          where('email', '<=', lowerCaseQuery + '\uf8ff'),
          limit(5)
        );

        const querySnapshot = await getDocs(emailQuery);
        const managerUids = managers.map(m => m.id);

        const results = querySnapshot.docs
          .map(docToManager)
          .filter(user => user.id !== currentUser.profile.id && !managerUids.includes(user.id));
        
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching for users:", error);
        toast.error("Fout bij het zoeken naar gebruikers.");
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery, currentUser?.id, managers]);
  
  const addManager = async (user: Manager) => {
    if (!user.id) return;
    try {
        await addManagerToProfile(profileId, user.id);
        setSearchQuery('');
        setSearchResults([]);
        toast.success(`${user.firstName || 'Gebruiker'} is nu een beheerder.`);
    } catch (error) {
        console.error("Error adding manager:", error);
        toast.error("Kon beheerder niet toevoegen.");
    }
  };

  const removeManager = async (managerId: string) => {
    try {
        await removeManagerFromProfile(profileId, managerId);
        toast.success(`Beheerder verwijderd.`);
    } catch (error) {
        console.error("Error removing manager:", error);
        toast.error("Kon beheerder niet verwijderen.");
    }
  };

  return {
    managers,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    addManager,
    removeManager,
  };
}