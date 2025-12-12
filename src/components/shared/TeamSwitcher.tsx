// src/components/shared/TeamSwitcher.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, LogOut, PlusCircle, Settings, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
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
import { UserAvatar } from './user-avatar';
import type { UserProfile, SubProfile } from '@/types/user';
import { logoutAction } from '@/lib/server/actions/auth'

type TeamSwitcherProps = {
  user: UserProfile & { id: string };
  profiles: (SubProfile & { id: string })[];
  className?: string;
};

export default function TeamSwitcher({ user, profiles, className }: TeamSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeProfileId, setActiveProfileId] = React.useState(user.id);
  const [showMenu, setShowMenu] = React.useState(false);

  // ✅ Combine user + subProfiles
  const allProfiles = [user, ...profiles];
  const selectedProfile = allProfiles.find(p => p.id === activeProfileId) ?? user;

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutAction();
      
      if (result.success) {
        toast.success('Succesvol uitgelogd');
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.error || 'Uitloggen mislukt');
      }
    });
  };

  const handleProfileSwitch = (profileId: string) => {
    setActiveProfileId(profileId);
    setShowMenu(false);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={showMenu}
            className="w-[220px] justify-between"
          >
            <div className="flex items-center truncate">
              <UserAvatar profile={selectedProfile} className="mr-2 h-5 w-5" />
              <span className="truncate">{selectedProfile.displayName}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[220px]">
          <DropdownMenuLabel>Wissel van profiel</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allProfiles.map((profile) => (
            <DropdownMenuItem key={profile.id} onClick={() => handleProfileSwitch(profile.id)}>
              <UserAvatar profile={profile} className="mr-2 h-5 w-5" />
              <span>{profile.displayName}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Link href="/dashboard/add-profile" passHref>
            <DropdownMenuItem>
              <PlusCircle className="mr-2 h-5 w-5" />
              Nieuw Profiel
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <UserAvatar profile={user} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/dashboard" passHref>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings" passHref>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Instellingen</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isPending ? 'Uitloggen...' : 'Uitloggen'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}