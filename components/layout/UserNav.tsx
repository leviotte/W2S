'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  CircleUserRound,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';
import { auth } from '@/lib/client/firebase';

export function UserNav() {
  const { user, profiles, activeProfile, switchToProfile } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/'); // Redirect to home after logout
  };
  
  const currentUserDisplayName = `${user.firstName} ${user.lastName}`;
  const currentUserPhoto = user.photoURL;
  
  const activeDisplayName = activeProfile?.name || currentUserDisplayName;
  const activePhoto = activeProfile?.avatarURL || currentUserPhoto;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 justify-start space-x-2 px-2">
           <div className="h-8 w-8 rounded-full bg-background">
            {activePhoto ? (
              <Image
                src={activePhoto}
                alt={activeDisplayName}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <CircleUserRound className="h-8 w-8 text-muted-foreground" />
            )}
           </div>
          <div className="hidden text-left leading-tight md:grid">
            <span className="truncate font-semibold">{activeDisplayName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
           <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUserDisplayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Profielen</DropdownMenuLabel>
         <DropdownMenuItem onClick={() => switchToProfile('main-account')}>
            <CircleUserRound className="mr-2 h-4 w-4" />
            <span>Hoofdaccount</span>
        </DropdownMenuItem>
        {profiles.map((profile) => (
          <DropdownMenuItem key={profile.id} onClick={() => switchToProfile(profile.id)}>
             <CircleUserRound className="mr-2 h-4 w-4" />
             <span>{profile.name}</span>
          </DropdownMenuItem>
        ))}
         <DropdownMenuItem onClick={() => router.push('/dashboard/add-profile')}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Voeg profiel toe</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Instellingen</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log Uit</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}