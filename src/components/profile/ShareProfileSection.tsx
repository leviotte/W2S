'use client';

import { Search, X } from 'lucide-react';
import { useProfileManagers } from '@/hooks/use-profile-managers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ShareProfileSectionProps {
  profileId: string;
}

export function ShareProfileSection({ profileId }: ShareProfileSectionProps) {
  const {
    managers,
    searchResults,
    isLoading,
    isSearching,
    addManager,
    removeManager,
    setSearchQuery,
  } = useProfileManagers(profileId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profielbeheerders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zoekfunctionaliteit */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek gebruiker op naam of e-mail..."
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
          {isSearching && <LoadingSpinner className="absolute right-3 top-1/2 -translate-y-1/2" />}
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg">
              {searchResults.map((user) => (
                <div key={user.id} className="p-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto"
                    onClick={() => addManager(user)}
                  >
                    {/* FOUT OPGELOST: 'name' prop gebruiken met 'displayName' */}
                    <UserAvatar src={user.photoURL} name={user.displayName} className="h-8 w-8 mr-2" />
                    <div className="text-left">
                      {/* FOUT OPGELOST: 'displayName' gebruiken */}
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lijst van huidige managers */}
        <div className="space-y-3">
          {isLoading && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
          {!isLoading && managers.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nog geen beheerders toegevoegd.
            </p>
          )}
          {managers.map((manager) => (
            <div key={manager.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                 {/* FOUT OPGELOST: 'name' prop gebruiken met 'displayName' */}
                <UserAvatar src={manager.photoURL} name={manager.displayName} className="h-10 w-10" />
                <div>
                   {/* FOUT OPGELOST: 'displayName' gebruiken */}
                  <p className="font-medium">{manager.displayName}</p>
                  <p className="text-sm text-muted-foreground">{manager.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeManager(manager.id)}
                aria-label={`Verwijder ${manager.displayName}`}
              >
                <X className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}