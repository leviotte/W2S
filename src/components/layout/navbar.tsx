// src/components/layout/navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Home, Search, ChevronDown, Plus } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { logoutAction } from '@/lib/server/actions/auth';
import { UserAvatar } from '@/components/shared/user-avatar';
import { NotificationBadge } from '@/components/shared/notification-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { currentUser, isAuthenticated, isAdmin, openLoginModal, openRegisterModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // TODO: Get from real-time store/context
  const unreadCount = 0;

  const handleLogout = async () => {
    await logoutAction();
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const menuItems = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: Home },
        isAdmin && { label: 'Admin', path: '/admin', icon: Home },
        { label: 'Zoek vrienden', path: '/search', icon: Search },
      ].filter(Boolean)
    : [];

  return (
    <nav className="bg-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/wish2share.png"
              alt="Wish2Share Logo"
              width={96}
              height={96}
              className="h-16 md:h-24 pb-2 pl-0"
              priority
            />
            <span className="ml-0 text-3xl font-bold text-chart-5">
              Wish2Share
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item: any) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  pathname === item.path ? 'bg-gray-200' : ''
                }`}
              >
                {item.icon && <item.icon className="h-5 w-5 mr-1" />}
                {item.label}
                {item.path === '/dashboard' && unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} className="ml-1" />
                )}
              </Link>
            ))}

            {isAuthenticated && currentUser ? (
              <UserMenu user={currentUser} isAdmin={isAdmin} onLogout={handleLogout} />
            ) : (
              <>
                <Button
                  onClick={openLoginModal}
                  className="bg-warm-olive text-white hover:bg-cool-olive"
                >
                  Log In
                </Button>
                <Button
                  onClick={openRegisterModal}
                  variant="outline"
                  className="text-warm-olive border-warm-olive hover:bg-warm-beige"
                >
                  Registreer
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item: any) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                  {item.label}
                  {item.path === '/dashboard' && unreadCount > 0 && (
                    <NotificationBadge count={unreadCount} className="ml-2" />
                  )}
                </div>
              </Link>
            ))}

            {isAuthenticated && currentUser ? (
              <div className="pt-4 border-t border-gray-200 mt-2">
                <UserMenu user={currentUser} isAdmin={isAdmin} onLogout={handleLogout} isMobile />
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-gray-200 mt-2">
                <Button
                  onClick={() => {
                    openLoginModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-warm-olive text-white hover:bg-cool-olive"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    openRegisterModal();
                    setIsMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full text-warm-olive border-warm-olive hover:bg-warm-beige"
                >
                  Registreer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ============================================================================
// USER MENU COMPONENT
// ============================================================================

interface UserMenuProps {
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
  isMobile?: boolean;
}

function UserMenu({ user, isAdmin, onLogout, isMobile = false }: UserMenuProps) {
  const router = useRouter();
  
  if (isMobile) {
    return (
      <div className="space-y-1">
        {/* User Info */}
        <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
          <UserAvatar
            photoURL={user.photoURL}
            firstName={user.firstName}
            lastName={user.lastName}
            size="md"
            className="flex-shrink-0"
          />
          <div className="ml-3 min-w-0 flex-1">
            <div className="text-base font-medium text-gray-800 truncate">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </div>
            <div className="text-sm text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        
        {/* Menu Items */}
        <button
          onClick={() => {
            router.push('/dashboard/profile');
          }}
          className="w-full text-left px-3 py-2 text-base text-gray-600 hover:bg-gray-100 rounded-md"
        >
          Profiel
        </button>
        
        {isAdmin && (
          <button
            onClick={() => {
              router.push('/admin');
            }}
            className="w-full text-left px-3 py-2 text-base text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Admin Dashboard
          </button>
        )}
        
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-base text-red-600 hover:bg-red-50 rounded-md"
        >
          Log Uit
        </button>
      </div>
    );
  }
  
  // Desktop Dropdown Menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors">
          <UserAvatar
            photoURL={user.photoURL}
            firstName={user.firstName}
            lastName={user.lastName}
            size="sm"
          />
          <div className="hidden lg:block text-left text-sm leading-tight">
            <span className="truncate font-semibold block max-w-[150px]">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </span>
            <span className="truncate text-xs text-gray-500 block max-w-[150px]">
              {user.email}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
          Profiel Instellingen
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
          Log Uit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}