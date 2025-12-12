'use client';

import { useState, useEffect, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import {
  getManagersForProfile,
  searchUsersAction,
  addManagerAction,
  removeManagerAction,
} from '@/lib/server/actions/profile-actions';
import type { UserProfile } from '@/types/user';

export function useProfileManagers(profileId: string) {
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isMutating, startMutation] = useTransition();

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Effect om de initiële managers op te halen
  useEffect(() => {
    if (!profileId) {
        setIsLoading(false);
        return;
    };
    const fetchManagers = async () => {
      setIsLoading(true);
      const initialManagers = await getManagersForProfile(profileId);
      setManagers(initialManagers);
      setIsLoading(false);
    };
    fetchManagers();
  }, [profileId]);

  // Effect om te zoeken wanneer de gebruiker stopt met typen
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      const result = await searchUsersAction(debouncedSearchQuery);
      
      // CORRECTIE: Eerst controleren op 'success'
      if (result.success) {
        // Filter gebruikers die al manager zijn of de huidige gebruiker
        const existingManagerIds = new Set(managers.map(m => m.id));
        existingManagerIds.add(profileId); // Voeg de profieleigenaar zelf toe
        
        const filteredData = result.data?.filter(user => !existingManagerIds.has(user.id)) || [];
        setSearchResults(filteredData);
      } else {
        // In deze 'else'-blok weet TypeScript dat 'result.error' MOET bestaan.
        toast.error(result.error || 'Fout bij het zoeken naar gebruikers.');
      }
      setIsSearching(false);
    };

    performSearch();
  }, [debouncedSearchQuery, managers, profileId]);

  const addManager = (user: UserProfile) => {
    startMutation(async () => {
      // Optimistic update
      setManagers((prev) => [...prev, user]);
      setSearchQuery('');
      setSearchResults((prev) => prev.filter(u => u.id !== user.id));

      const result = await addManagerAction(profileId, user.id);
      if (!result.success) {
        toast.error(result.error);
        // Rollback
        setManagers((prev) => prev.filter((m) => m.id !== user.id));
      } else {
        toast.success(`${user.displayName} is nu een beheerder.`);
      }
    });
  };

  const removeManager = (managerId: string) => {
    const managerToRemove = managers.find(m => m.id === managerId);
    if (!managerToRemove) return;
    
    startMutation(async () => {
      // Optimistic update
      setManagers((prev) => prev.filter((m) => m.id !== managerId));
      
      const result = await removeManagerAction(profileId, managerId);
      if (!result.success) {
        toast.error(result.error);
        // Rollback
        setManagers((prev) => [...prev, managerToRemove].sort((a,b) => a.displayName.localeCompare(b.displayName)));
      } else {
        toast.success(`${managerToRemove.displayName} is geen beheerder meer.`);
      }
    });
  };

  return {
    managers,
    searchQuery,
    searchResults,
    isLoading: isLoading,
    isMutating,
    isSearching,
    addManager,
    removeManager,
    setSearchQuery,
  };
}