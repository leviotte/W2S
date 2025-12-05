"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, CircleUserRound, Plus } from 'lucide-react';
import { useProfileStore, type Profile, type User } from '@/lib/store/use-profile-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export function TeamSwitcher({ user }: { user: User }) {
  const router = useRouter();

  // Haal state en actions uit onze nieuwe, gespecialiseerde store
  const { 
    profiles, 
    activeProfile, 
    loading, 
    initializeProfiles, 
    cleanupListeners, 
    switchToProfile 
  } = useProfileStore();

  // Initialiseer de profielen en ruim de listeners op wanneer de component unmount
  useEffect(() => {
    if (user?.id) {
      initializeProfiles(user, router);
    }
    return () => {
      cleanupListeners();
    };
  }, [user?.id, initializeProfiles, cleanupListeners, router]);

  const handleAddProfile = () => {
    router.push('/dashboard?tab=add-profile');
  };

  // MENTOR-VERBETERING: Toon een loading state voor een betere UX
  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-[120px]" />
        </div>
      </div>
    );
  }

  const currentProfile = activeProfile || profiles.find(p => p.mainAccount);
  const avatar = currentProfile?.avatarURL;
  const activeName = currentProfile?.name || 'Selecteer Profiel';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 h-auto">
          <div className="flex items-center space-x-2 w-full">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {avatar ? (
                <img
                  src={avatar}
                  alt={activeName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <CircleUserRound className="h-6 w-6" />
              )}
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{activeName}</span>
            </div>

            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[200px]" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Wissel van profiel</DropdownMenuLabel>
        
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => switchToProfile(p.id, router)} // MENTOR-FIX: Correcte onClick syntax
            className={`gap-2 p-2 ${p.id === activeProfile?.id ? 'bg-accent text-accent-foreground' : ''}`}
            disabled={p.id === activeProfile?.id}
          >
            <div className="flex items-center space-x-2">
              {p.avatarURL ? (
                <img
                  src={p.avatarURL}
                  alt={p.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <CircleUserRound className="h-6 w-6" />
              )}
              <span>{p.name}</span>
            </div>
          </DropdownMenuItem>
        ))}

        {/* Toon "Voeg profiel toe" enkel als het hoofdaccount actief is */}
        {activeProfile?.mainAccount && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddProfile} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <span className="font-medium">Voeg profiel toe</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}