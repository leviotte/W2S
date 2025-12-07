// src/components/layout/site-header.tsx
'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift, LogIn, LogOut, Menu, User, UserPlus, Settings } from 'lucide-react';

// FIX: Importeer beide hooks
import { useAuthStore, useAuthModal } from '@/lib/store/use-auth-store';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserAvatar } from '../shared/user-avatar';
// FIX: Gebruik AuthedUser, want dat is wat je van de server krijgt
import { AuthedUser } from '@/types/user';

interface UserButtonProps {
  user: AuthedUser; // Accepteer het server-side gebruikerstype
}

function UserButton({ user }: UserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.refresh();
    });
  };

  const getFullName = (): string => {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || 'Gebruiker';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar src={user.photoURL} name={getFullName()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getFullName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* FIX: Correcte onClick syntax overal */}
        <DropdownMenuItem onClick={() => router.push('/dashboard/info')}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mijn Profiel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Instellingen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log uit</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SiteHeaderProps {
  currentUser: AuthedUser | null; // Accepteer het server-side gebruikerstype
}

export default function SiteHeader({ currentUser }: SiteHeaderProps) {
  // FIX: Haal de 'open' functie op uit de modal-specifieke hook
  const { open: openModal } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Gift className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block">Wish2Share</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {currentUser ? (
            <UserButton user={currentUser} />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              {/* FIX: Correcte onClick syntax en modal aanroep */}
              <Button variant="ghost" onClick={() => openModal('login')}>
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Button>
              <Button onClick={() => openModal('register')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Registreer
              </Button>
            </div>
          )}
          <div className="sm:hidden">
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}