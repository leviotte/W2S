// src/app/dashboard/profile/_components/profile-client.tsx
'use client';

import { useState } from 'react';
import { UserProfile } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalInfoForm from './personal-info-form';
import AddressForm from './address-form';
import PhotoForm from './photo-form';
import PublicStatusForm from './public-status-form';
import { useProfileManagers } from '@/hooks/use-profile-managers';
import { SubmitButton } from '@/components/ui/submit-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileClientProps {
  profile: UserProfile & { id: string };
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState('personal');

  // ==============================
  // HOOK FOR MANAGERS + SEARCH
  // ==============================
  const {
    managers,
    searchQuery,
    searchResults,
    isLoading,
    isMutating,
    isSearching,
    addManager,
    removeManager,
    setSearchQuery,
  } = useProfileManagers(profile.id);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Profiel Instellingen</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
          <TabsTrigger value="address">Adres</TabsTrigger>
          <TabsTrigger value="photo">Foto</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="sharing">Delen</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Persoonlijke Informatie</CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Adresgegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photo">
          <Card>
            <CardHeader>
              <CardTitle>Profielfoto</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Instellingen</CardTitle>
            </CardHeader>
            <CardContent>
              <PublicStatusForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle>Profielbeheerders Toevoegen</CardTitle>
              <p className="text-sm text-muted-foreground">
                Zoek gebruikers via e-mailadres of naam en geef hen toegang tot dit profiel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SEARCH INPUT */}
              <div className="relative">
                <Label htmlFor="search">Zoek gebruiker</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Naam of e-mailadres"
                  disabled={isMutating}
                />
                {isSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground animate-pulse">
                    Zoeken...
                  </span>
                )}
              </div>

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-md max-h-64 overflow-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      disabled={isMutating}
                      onClick={() => addManager(user)}
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
                  ))}
                </div>
              )}

              {/* CURRENT MANAGERS */}
              {managers.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {managers.map(manager => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={manager.photoURL || undefined} alt={manager.displayName} />
                          <AvatarFallback>
                            {manager.firstName?.[0]}{manager.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{manager.displayName}</p>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                        </div>
                      </div>
                      <SubmitButton
                        variant="ghost"
                        size="icon"
                        onClick={() => removeManager(manager.id)}
                        disabled={isMutating}
                      >
                        <X className="h-4 w-4" />
                      </SubmitButton>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground mt-4">
                  Nog geen extra beheerders toegevoegd
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
