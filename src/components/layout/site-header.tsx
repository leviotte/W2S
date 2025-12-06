/**
 * src/components/layout/site-header.tsx
 *
 * Dit is de definitieve, hybride versie.
 * Het ontvangt initiële data via props van de server voor een snelle laadtijd.
 * Voor interacties (logout, modals openen) gebruikt het de client-side Zustand store.
 */
'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift, LogIn, LogOut, Menu, User, UserPlus, Settings } from 'lucide-react';

import { useAuthStore, useAuthModal } from '@/lib/store/use-auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// AANPASSING: Importeer de UserAvatar uit de 'shared' map
import { UserAvatar } from '../shared/user-avatar';
import { UserProfile } from '@/types/user';

interface UserButtonProps {
  user: UserProfile;
}

function UserButton({ user }: UserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push('/');
      router.refresh(); // Zorgt ervoor dat de server-side state (header) vernieuwt
    });
  };

  // Helper om de volledige naam te krijgen. Jouw UserAvatar component maakt hier zelf de initialen van.
  const getFullName = (): string => {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {/* HIER IS DE UPDATE: We gebruiken nu de 'name' prop van jouw UserAvatar */}
          <UserAvatar src={user.photoURL} name={getFullName()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/dashboard')}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/profile/${user.username || user.id}`)}>
          <User className="mr-2 h-4 w-4" />
          <span>Mijn Profiel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Instellingen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} disabled={isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log uit</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SiteHeaderProps {
  currentUser: UserProfile | null;
}

export default function SiteHeader({ currentUser }: SiteHeaderProps) {
  const { showLogin, showRegister } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Gift className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block">Wish2Share</span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center space-x-4">
          {/* Hier komen later je navigatie-items */}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {currentUser ? (
            <UserButton user={currentUser} />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" onClick={showLogin}>
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Button>
              <Button onClick={showRegister}>
                <UserPlus className="mr-2 h-4 w-4" />
                Registreer
              </Button>
            </div>
          )}

          <div className="sm:hidden">
            {/* Hier komt later je mobiele menu logica */}
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}