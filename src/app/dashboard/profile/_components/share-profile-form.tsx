// src/app/dashboard/profile/_components/share-profile-form.tsx
'use client';

import { useState, useTransition, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Loader2, UserPlus, X } from 'lucide-react';

import type { UserProfile } from '@/types/user';
import {
  addManagerAction,
  removeManagerAction,
  searchUsersAction,
} from '@/app/dashboard/profile/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SubmitButton } from '@/components/ui/submit-button';

interface ShareProfileFormProps {
  initialManagers: UserProfile[];
}

export function ShareProfileForm({ initialManagers }: ShareProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  // We gebruiken de initialManagers prop om de lijst van huidige manager IDs bij te houden.
  const currentManagerIds = initialManagers.map(m => m.id);

  const handleSearch = useDebouncedCallback(async (term: string) => {
    if (term.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await searchUsersAction(term, currentManagerIds);
    setSearchResults(results);
    setIsSearching(false);
  }, 300); // 300ms debounce

  const handleAddManager = (formData: FormData) => {
    startTransition(async () => {
      const result = await addManagerAction(formData);
      if (result.success) {
        toast.success(result.message);
        setSearchResults(prev => prev.filter(user => user.id !== formData.get('managerId')));
      } else {
        toast.error(result.message);
      }
    });
  };
  
  const handleRemoveManager = (formData: FormData) => {
    startTransition(async () => {
      const result = await removeManagerAction(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiel Delen</CardTitle>
        <CardDescription>
          Geef andere gebruikers toegang om dit profiel te beheren. Ze kunnen
          wishlists, evenementen en instellingen aanpassen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Zoeksectie --- */}
        <div>
          <label htmlFor="manager-search" className="mb-2 block text-sm font-medium">
            Zoek gebruiker op e-mail
          </label>
          <div className="relative">
            <Input
              id="manager-search"
              placeholder="naam@voorbeeld.com"
              onChange={(e) => {
                setIsSearching(true);
                handleSearch(e.target.value);
              }}
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 rounded-md border">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <UserAvatar profile={user} className="h-8 w-8" />
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <form action={handleAddManager}>
                    <input type="hidden" name="managerId" value={user.id} />
                    <SubmitButton size="sm" variant="outline" loadingText="Voeg toe...">
                      <UserPlus className="mr-2 h-4 w-4" /> Toevoegen
                    </SubmitButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-medium">Huidige Beheerders</h4>
          {initialManagers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Je hebt nog geen beheerders toegevoegd.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {initialManagers.map((manager) => (
                <li key={manager.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar profile={manager} className="h-9 w-9" />
                    <div>
                      <p className="font-medium">{manager.displayName}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                    </div>
                  </div>
                  <form action={handleRemoveManager}>
                    <input type="hidden" name="managerId" value={manager.id} />
                    <SubmitButton 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      loadingText=""
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}