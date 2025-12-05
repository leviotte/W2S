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

import { useAuthStore, useAuthModal } from '@/lib/store/use-auth-store'; // Dit blijft cruciaal!
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '../shared/user-avatar';
import { UserProfile } from '@/types/user'; // Belangrijk voor type-safety

/**
 * WIJZIGING 1: UserButton accepteert nu de user als prop.
 */
interface UserButtonProps {
  user: UserProfile;
}

function UserButton({ user }: UserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // WIJZIGING 2: We halen enkel de 'logout' functie uit de store. De 'user' data komt via props!
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push('/');
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar user={user} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* CORRECTIE: Gebruik de 'onSelect' prop voor DropdownMenuItems */}
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


/**
 * WIJZIGING 3: Het hoofcomponent accepteert nu de 'currentUser' als prop.
 */
interface SiteHeaderProps {
  currentUser: UserProfile | null;
}

export default function SiteHeader({ currentUser }: SiteHeaderProps) {
  // We gebruiken de custom hook voor de modals. Dit blijft perfect.
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
            // We geven de prop door aan de UserButton
            <UserButton user={currentUser} />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              {/* CORRECTIE: De functie moet in de 'onClick' prop, niet als losse prop */}
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
              <Button size="icon" variant="ghost">
                <Menu className="h-5 w-5"/>
              </Button>
          </div>
        </div>
      </div>
    </header>
  );
}