// src/components/layout/site-header.tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/use-auth-store'; // Haalt zelf de state op
import { logoutAction } from '@/lib/auth/actions';
import { UserAvatar } from '@/components/shared/user-avatar';
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// GEEN PROPS MEER NODIG!
export default function SiteHeader() {
  const router = useRouter();
  const { currentUser, openAuthModal } = useAuthStore((state) => ({
    currentUser: state.currentUser,
    openAuthModal: state.openAuthModal,
  }));

  const handleLogout = async () => {
    // ... logout logica ...
  };

  const getFullName = () => {
    if (!currentUser) return 'Gebruiker';
    return currentUser.profile.firstName || 'Gebruiker';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* ... je header JSX ... */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {currentUser ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserAvatar
                    src={null} // photoURL zit niet in SessionUser, de avatar fallback handelt dit af
                    name={getFullName()}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getFullName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <Link href="/dashboard"><DropdownMenuItem>Dashboard</DropdownMenuItem></Link>
                  <Link href="/dashboard/profile"><DropdownMenuItem>Profiel</DropdownMenuItem></Link>
                  <Link href="/dashboard/settings"><DropdownMenuItem>Instellingen</DropdownMenuItem></Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Uitloggen</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="space-x-2">
              <Button onClick={() => openAuthModal('login')} variant="ghost">Inloggen</Button>
              <Button onClick={() => openAuthModal('register')}>Registreren</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}