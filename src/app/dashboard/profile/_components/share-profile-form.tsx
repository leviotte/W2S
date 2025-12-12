// src/app/dashboard/profile/_components/share-profile-form.tsx
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { X, Search } from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/client/firebase'; // ✅ CORRECTE IMPORT
import { removeManagerByIdAction } from '@/lib/server/actions/profile-actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubmitButton } from '@/components/ui/submit-button';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileManager {
  userId: string;
  email: string;
  displayName?: string;
  grantedAt: Date;
  grantedBy: string;
}

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

interface ShareProfileFormProps {
  profile: UserProfile & { id: string };
  managers: ProfileManager[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ShareProfileForm({ profile, managers }: ShareProfileFormProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [usersCache, setUsersCache] = useState<SearchResult[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // LOAD ALL USERS (real-time cache)
  // ============================================================================

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          firstName: doc.data().firstName || '',
          lastName: doc.data().lastName || '',
          displayName: doc.data().displayName || '',
          email: doc.data().email || '',
          photoURL: doc.data().photoURL || null,
        }));
        
        setUsersCache(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  // ============================================================================
  // SEARCH LOGIC (debounced)
  // ============================================================================

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchEmail.trim() || searchEmail.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Filter from cache first for instant results
        const cachedResults = usersCache.filter(user =>
          user.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
          user.id !== profile.userId &&
          !managers.some(m => m.userId === user.id)
        ).slice(0, 5);

        setSearchResults(cachedResults);

        // Then query Firebase for more accurate results
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('email', '>=', searchEmail.toLowerCase()),
          where('email', '<=', searchEmail.toLowerCase() + '\uf8ff'),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        
        const results = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              displayName: data.displayName || `${data.firstName} ${data.lastName}`,
              email: data.email || '',
              photoURL: data.photoURL || null,
            };
          })
          .filter(user =>
            user.id !== profile.userId &&
            !managers.some(m => m.userId === user.id)
          );

        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Fout bij zoeken');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchEmail, usersCache, profile.userId, managers]);

  // ============================================================================
  // HANDLE SELECT USER - DIRECT SERVER ACTION CALL
  // ============================================================================

  const handleSelectUser = async (user: SearchResult) => {
    startTransition(async () => {
      try {
        // ✅ DIRECT IMPORT VAN DE CORE ACTION
        const { addManagerAction } = await import('@/lib/server/actions/profile-actions');
        
        const result = await addManagerAction(profile.id, user.id);

        if (result.success) {
          toast.success('Beheerder toegevoegd', {
            description: `${user.displayName} kan nu dit profiel beheren`,
          });
          setSearchEmail('');
          setSearchResults([]);
          setShowResults(false);
          
          // Refresh de pagina
          window.location.reload();
        } else {
          toast.error('Fout', {
            description: result.error || 'Kon beheerder niet toevoegen',
          });
        }
      } catch (error) {
        console.error('Error adding manager:', error);
        toast.error('Er is iets misgegaan');
      }
    });
  };

  // ============================================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // GET MANAGER DISPLAY DATA
  // ============================================================================

  const getManagerDisplayData = (manager: ProfileManager) => {
    const user = usersCache.find(u => u.id === manager.userId);
    return {
      displayName: user?.displayName || manager.displayName || manager.email,
      photoURL: user?.photoURL || null,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    };
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* SEARCH SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Profielbeheerders Toevoegen</CardTitle>
          <CardDescription>
            Zoek gebruikers via e-mailadres en geef hen toegang tot dit profiel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={searchContainerRef}>
            <Label htmlFor="search-email">E-mailadres</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-email"
                type="email"
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="naam@voorbeeld.com"
                className="pl-9"
                disabled={isPending}
              />
            </div>

            {/* DROPDOWN RESULTS */}
            {showResults && searchEmail.length >= 3 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto">
                {isSearching ? (
                  <div className="p-3 text-center text-muted-foreground">
                    <span className="animate-pulse">Zoeken...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground mb-2">
                      Geen gebruiker gevonden met dit e-mailadres
                    </p>
                    <p className="text-sm text-muted-foreground">
                      De gebruiker moet eerst een account aanmaken op Wish2Share.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CURRENT MANAGERS */}
      {managers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Huidige Beheerders</CardTitle>
            <CardDescription>
              Deze gebruikers hebben toegang om dit profiel te beheren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {managers.map((manager) => {
              const displayData = getManagerDisplayData(manager);
              
              return (
                <div
                  key={manager.userId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={displayData.photoURL || undefined} alt={displayData.displayName} />
                      <AvatarFallback>
                        {displayData.firstName?.[0]}{displayData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{displayData.displayName}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                  </div>
                  <RemoveManagerButton
                    profileId={profile.id}
                    managerId={manager.userId}
                    managerName={displayData.displayName}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {managers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nog geen extra beheerders toegevoegd
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// REMOVE MANAGER BUTTON
// ============================================================================

function RemoveManagerButton({
  profileId,
  managerId,
  managerName,
}: {
  profileId: string;
  managerId: string;
  managerName: string;
}) {
  const [removeState, removeFormAction] = useFormState(removeManagerByIdAction, {
    message: '',
    success: undefined,
  });

  useEffect(() => {
    if (removeState.success) {
      toast.success('Beheerder verwijderd', {
        description: `${managerName} heeft geen toegang meer`,
      });
      
      // Refresh de pagina na succesvolle verwijdering
      setTimeout(() => window.location.reload(), 500);
    } else if (removeState.message && removeState.success === false) {
      toast.error('Fout', { description: removeState.message });
    }
  }, [removeState, managerName]);

  return (
    <form action={removeFormAction}>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="managerId" value={managerId} />
      <SubmitButton
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        pendingText=""
      >
        <X className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}