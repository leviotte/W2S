// src/components/shared/TeamSwitcher.tsx

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';

import { useAuthStore } from '@/lib/store/use-auth-store';
import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { type SessionUser, type UserProfile } from '@/types/user';

// Combineer de types voor het gemak. Een profiel kan een hoofdprofiel (SessionUser) of subprofiel (UserProfile) zijn.
type AnyProfile = SessionUser | UserProfile;

export function TeamSwitcher() {
  const router = useRouter();
  const { user, profiles, isLoading, activeProfileId, setActiveProfileId } = useAuthStore(state => ({
    user: state.user,
    profiles: state.profiles,
    isLoading: state.isLoading,
    activeProfileId: state.activeProfileId,
    setActiveProfileId: state.setActiveProfileId,
  }));
  
  const [open, setOpen] = React.useState(false);

  const handleProfileSwitch = (profileId: string) => {
    setActiveProfileId(profileId);
    setOpen(false);
    // Herlaad de pagina om zeker te zijn dat alle data voor het nieuwe profiel wordt geladen
    // Dit is een simpele maar effectieve strategie
    router.refresh(); 
  };
  
  // Combineer hoofdaccount en subprofielen tot één enkele, getypte lijst
  const allProfiles: AnyProfile[] = user ? [user, ...profiles] : [...profiles];
  
  // Zoek het geselecteerde profiel in de gecombineerde lijst, met het hoofdaccount als fallback
  const selectedProfile = allProfiles.find(p => p.id === activeProfileId) || user;

  // Toon een duidelijke loading state
  if (isLoading) {
    return (
        <div className="flex items-center space-x-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-28" />
        </div>
    );
  }
  
  // Als er geen gebruiker is na het laden, toon niets (of een login knop)
  if (!user) {
    return null; 
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecteer een profiel"
          className="w-[200px] justify-between"
        >
          <Avatar className="mr-2 h-6 w-6">
            <AvatarImage
              src={selectedProfile?.photoURL || undefined}
              alt={selectedProfile?.displayName || 'Gebruiker'}
            />
            <AvatarFallback>{selectedProfile?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[120px]">{selectedProfile?.displayName}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="end" forceMount>
        <DropdownMenuLabel>Beschikbare Profielen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {allProfiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              onSelect={() => handleProfileSwitch(profile.id)}
              className="text-sm cursor-pointer"
            >
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage
                  src={profile.photoURL || undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback>{profile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate">{profile.displayName}</span>
              <Check
                className={cn(
                  'ml-auto h-4 w-4',
                  activeProfileId === profile.id ? 'opacity-100' : 'opacity-0'
                )}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/dashboard/add-profile')} className="cursor-pointer">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nieuw Profiel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}