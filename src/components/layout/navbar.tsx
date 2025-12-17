// src/components/layout/navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Home, Search, ChevronDown, Plus, CircleUserRound } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { logoutAction } from '@/lib/server/actions/auth';
import { NotificationBadge } from '@/components/shared/notification-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { currentUser, isAuthenticated, isAdmin, openLoginModal, openRegisterModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // TODO: Get from real-time store/context
  const unreadCount = 0;
  const profiles: any[] = []; // TODO: Get from profiles store
  const activeProfileId = typeof window !== 'undefined' ? localStorage.getItem('activeProfile') : null;
  
  const filteredProfiles = profiles.filter((p) => p.id !== 'main-account');
  const activeProfile =
    activeProfileId === 'main-account'
      ? null
      : profiles.find((p) => p.id === activeProfileId);

  const handleLogout = async () => {
    await logoutAction();
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleProfileSwitch = async (profileId: string) => {
    // TODO: Implement profile switch logic
    localStorage.setItem('activeProfile', profileId);
    router.refresh();
  };

  const handleAddProfile = () => {
    router.push('/dashboard?tab=add-profile');
  };

  const menuItems = isAuthenticated
  ? [
      { label: 'Dashboard', path: '/dashboard', icon: Home },
      isAdmin && { 
        label: 'Admin', 
        path: '/admin',  // ✅ GEFIXED (was /admin-dashboard?tab=metrics)
        icon: Home 
      },
      { label: 'Zoek vrienden', path: '/search', icon: Search },
    ].filter(Boolean)
  : [];

  return (
    <nav className="bg-gray-100 shadow-sm">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-4">
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
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                onClick={handleLinkClick}
              >
                {item.icon && <item.icon className="h-5 w-5 mr-1" />}
                {item.label}
                {item.path === '/dashboard' && unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} className="ml-1" />
                )}
              </Link>
            ))}

            {/* Profile Switcher - Desktop */}
            {isAuthenticated && currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 ml-4">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {activeProfile?.avatarURL || currentUser?.photoURL ? (
                        <img
                          src={activeProfile?.avatarURL || currentUser?.photoURL}
                          alt={
                            activeProfile?.name ||
                            `${currentUser?.firstName} ${currentUser?.lastName}`
                          }
                          className="h-8 w-8 object-cover rounded-full"
                        />
                      ) : (
                        <CircleUserRound className="h-8 w-8" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeProfile?.name ||
                          `${currentUser?.firstName} ${currentUser?.lastName}`}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {currentUser.email}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Profielen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Main Account */}
                  <DropdownMenuItem
                    onClick={() => handleProfileSwitch('main-account')}
                    className={`gap-2 p-2 font-bold text-accent ${
                      activeProfileId === 'main-account' ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={`${currentUser.firstName} ${currentUser.lastName}`}
                          className="h-6 w-6 object-cover rounded-full"
                        />
                      ) : (
                        <CircleUserRound className="h-6 w-6" />
                      )}
                      <span>{`${currentUser.firstName} ${currentUser.lastName}`}</span>
                    </div>
                  </DropdownMenuItem>
                  
                  {/* Sub Profiles */}
                  {filteredProfiles.map((profile) => (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleProfileSwitch(profile.id)}
                      className={`gap-2 p-2 ${
                        activeProfileId === profile.id ? 'bg-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {profile.avatarURL ? (
                          <img
                            src={profile.avatarURL}
                            alt={profile.name}
                            className="h-6 w-6 object-cover rounded-full"
                          />
                        ) : (
                          <CircleUserRound className="h-6 w-6" />
                        )}
                        <span>{profile.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Add Profile Button */}
                  <DropdownMenuItem onClick={handleAddProfile} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-accent">
                      <Plus className="size-4 text-white" />
                    </div>
                    <div className="font-medium hover:text-primary-foreground">
                      Voeg profiel toe
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Settings */}
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        isAdmin
                          ? '/admin-dashboard?tab=profile'
                          : '/dashboard?tab=profile'
                      )
                    }
                    className="gap-2 p-2"
                  >
                    Instellingen
                  </DropdownMenuItem>
                  
                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 p-2 text-[#b34c4c]"
                  >
                    Log Uit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auth Buttons - Desktop */}
            {!isAuthenticated && (
              <>
                <button
                  onClick={openLoginModal}
                  className="bg-warm-olive text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cool-olive"
                >
                  Log In
                </button>
                <button
                  onClick={openRegisterModal}
                  className="bg-white text-warm-olive border border-warm-olive px-4 py-2 rounded-md text-sm font-medium hover:bg-warm-beige"
                >
                  Registreer
                </button>
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item: any) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={handleLinkClick}
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

            {/* Profile Switcher - Mobile */}
            {isAuthenticated && currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 mt-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {activeProfile?.avatarURL || currentUser?.photoURL ? (
                        <img
                          src={activeProfile?.avatarURL || currentUser?.photoURL}
                          alt={
                            activeProfile?.name ||
                            `${currentUser?.firstName} ${currentUser?.lastName}`
                          }
                          className="h-8 w-8 object-cover rounded-full"
                        />
                      ) : (
                        <CircleUserRound className="h-8 w-8" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeProfile?.name ||
                          `${currentUser?.firstName} ${currentUser?.lastName}`}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {currentUser.email}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Profielen</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
  onClick={() =>
    router.push(
      isAdmin
        ? '/admin'  // ✅ GEFIXED (was /admin-dashboard?tab=profile)
        : '/dashboard?tab=profile'
    )
  }
  className="gap-2 p-2"
>
  Instellingen
</DropdownMenuItem>
                  
                  {filteredProfiles.map((profile) => (
                    <DropdownMenuItem
  onClick={() =>
    router.push(
      isAdmin
        ? '/admin'  // ✅ GEFIXED
        : '/dashboard?tab=profile'
    )
  }
  className="gap-2 p-2"
>
  Instellingen
</DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAddProfile} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-accent">
                      <Plus className="size-4 text-white" />
                    </div>
                    <div className="font-medium hover:text-primary-foreground">
                      Voeg profiel toe
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        isAdmin
                          ? '/admin-dashboard?tab=profile'
                          : '/dashboard?tab=profile'
                      )
                    }
                    className="gap-2 p-2"
                  >
                    Instellingen
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 p-2 text-[#b34c4c]"
                  >
                    Log Uit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auth Buttons - Mobile */}
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    openLoginModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left bg-warm-olive text-white px-3 py-2 rounded-md text-base font-medium hover:bg-cool-olive"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    openRegisterModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left bg-white text-warm-olive border border-warm-olive px-3 py-2 rounded-md text-base font-medium hover:bg-warm-beige mt-2"
                >
                  Registreer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}