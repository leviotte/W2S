'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Search } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth'; // <-- DE ECHTE AUTH HOOK!
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserNav } from './UserNav'; // We verplaatsen de UserNav logica zo meteen
import { useState } from 'react';

// Main Nav blijft een aparte component voor de duidelijkheid
function MainNav() {
  const pathname = usePathname();
  // TODO: Get real unread messages count
  const totalUnreadMessages = 5;

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Zoek Vrienden', path: '/search', icon: Search },
  ];

  return (
    <>
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            pathname === item.path ? 'bg-accent' : 'text-muted-foreground'
          )}
        >
          <item.icon className="mr-2 h-5 w-5" />
          {item.label}
          {item.path === '/dashboard' && totalUnreadMessages > 0 && (
             <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {totalUnreadMessages}
             </span>
          )}
        </Link>
      ))}
    </>
  );
}

export default function SiteHeader() {
  const { user, loading } = useAuth(); // Haal de user op
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // TODO: Implement login/register modal logic
  const handleLogin = () => console.log('Show login modal...');
  const handleRegister = () => console.log('Show register modal...');
  
  if (loading) {
    // Toon een simpele header of een skeleton loader terwijl auth status wordt gecheckt
    return <header className="sticky top-0 z-50 h-16 w-full border-b bg-background/95"></header>
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="/wish2share.png" alt="Wish2Share Logo" width={40} height={40} />
          <span className="hidden font-bold sm:inline-block">Wish2Share</span>
        </Link>
        
        <nav className="hidden flex-1 gap-4 md:flex">
          {user && <MainNav />}
        </nav>

        <div className="hidden flex-1 items-center justify-end space-x-4 md:flex">
          {user ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" onClick={handleLogin}>Log In</Button>
              <Button onClick={handleRegister}>Registreer</Button>
            </>
          )}
        </div>

        <div className="flex flex-1 justify-end md:hidden">
          <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon" aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      
      {isMenuOpen && (
         <div className="md:hidden">
          <div className="container flex flex-col space-y-2 py-4">
            {user ? (
              <>
                <MainNav />
                <hr className="my-2"/>
                <UserNav />
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={handleLogin}>Log In</Button>
                <Button className="w-full" onClick={handleRegister}>Registreer</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}