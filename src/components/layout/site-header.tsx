// src/components/layout/site-header.tsx
'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { useAuthModal } from '@/lib/store/use-auth-modal'; // APARTE IMPORT
import { logout } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types/user';

// Sub-component voor de ingelogde gebruiker
function UserNav({ user, onLogout, isLoggingOut }: { user: User; onLogout: () => void; isLoggingOut: boolean }) {
  const profile = user.profile;
  const displayName = profile.displayName;
  const email = profile.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar
            src={profile.photoURL}
            name={displayName}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {email && <p className="text-xs leading-none text-muted-foreground">{email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard" passHref><DropdownMenuItem>Dashboard</DropdownMenuItem></Link>
          <Link href="/dashboard/profile" passHref><DropdownMenuItem>Profiel</DropdownMenuItem></Link>
          <Link href="/dashboard/settings" passHref><DropdownMenuItem>Instellingen</DropdownMenuItem></Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hoofdcomponent
export default function SiteHeader() {
  const user = useAuthStore((state) => state.user);
  const { openModal } = useAuthModal(); // Haal acties uit de MODAL store
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Hier komt later je MainNav, we houden het nu simpel */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">Wish2Share</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? (
              <UserNav user={user} onLogout={handleLogout} isLoggingOut={isPending} />
            ) : (
              <>
                <Button variant="ghost" onClick={() => openModal('login')}>
                  Inloggen
                </Button>
                <Button onClick={() => openModal('register')}>Registreren</Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}