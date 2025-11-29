// app/dashboard/components/Navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  Menu,
  X,
  Home,
  Search,
  ChevronDown,
  CircleUserRound,
  Plus,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/dashboard/layout";
import NotificationBadge from "@/components/NotificationBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { currentUser, logout, events, profiles } = useStore();
  const { showLoginModal, showRegisterModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const activeProfileId = localStorage.getItem("activeProfile");
  const filteredProfiles = profiles.filter((p) => p.id !== "main-account");
  const activeProfile =
    activeProfileId === "main-account"
      ? null
      : profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    if (currentUser) {
      useStore.getState().subscribeToProfiles(currentUser.id, currentUser);
    }
  }, [currentUser]);

  const getTotalUnreadMessages = () => {
    if (!currentUser || !events) return 0;
    return events.reduce((total, event) => {
      const lastReadTimestamp = event.lastReadTimestamps?.[currentUser.id] || 0;
      const unreadMessages = (event.messages || []).filter(
        (msg) =>
          new Date(msg.timestamp).getTime() > lastReadTimestamp &&
          msg.userId !== currentUser.id
      ).length;
      return total + unreadMessages;
    }, 0);
  };

  const menuItems = currentUser
    ? [
        { label: "Dashboard", path: "/dashboard", icon: Home },
        currentUser.isAdmin && {
          label: "Admin",
          path: "/admin-dashboard?tab=metrics",
          icon: Home,
        },
        { label: "Zoek vrienden", path: "/search", icon: Search },
      ].filter(Boolean)
    : [];

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLinkClick = (path: string) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push("/");
  };

  const handleProfileSwitch = async (profileId: string) => {
    try {
      await useStore.getState().switchToProfile(profileId, router.push);
    } catch (error) {
      console.error("Failed to switch profile:", error);
    }
  };

  const handleAddProfile = () => {
    router.push("/dashboard?tab=add-profile");
  };

  return (
    <nav className="bg-gray-100 shadow-sm">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center">
            <img
              src="/wish2share.png"
              alt="Wish2Share Logo"
              className="h-16 md:h-24 pb-2 pl-0"
            />
            <span className="ml-0 text-3xl font-bold text-chart-5">
              Wish2Share
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {item.icon && <item.icon className="h-5 w-5 mr-1" />}
                {item.label}
                {item.path === "/dashboard" && getTotalUnreadMessages() > 0 && (
                  <NotificationBadge
                    count={getTotalUnreadMessages()}
                    className="ml-1"
                  />
                )}
              </button>
            ))}

            {currentUser && (
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
                  <DropdownMenuItem
                    onClick={() => handleProfileSwitch("main-account")}
                    className={`gap-2 p-2 font-bold text-accent ${
                      activeProfileId === "main-account" ? "bg-accent/10" : ""
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
                  {filteredProfiles.map((profile) => (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleProfileSwitch(profile.id)}
                      className={`gap-2 p-2 ${
                        activeProfileId === profile.id ? "bg-accent/10" : ""
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
                        currentUser.isAdmin
                          ? "admin-dashboard?tab=profile"
                          : "dashboard?tab=profile"
                      )
                    }
                    className="gap-2 p-2"
                  >
                    Instellingen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 p-2 text-[#b34c4c]">
                    Log Uit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!currentUser && (
              <>
                <button
                  onClick={() => showLoginModal()}
                  className="bg-warm-olive text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cool-olive"
                >
                  Log In
                </button>
                <button
                  onClick={() => showRegisterModal()}
                  className="bg-white text-warm-olive border border-warm-olive px-4 py-2 rounded-md text-sm font-medium hover:bg-warm-beige"
                >
                  Registreer
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} aria-label="Toggle menu" className="text-gray-600 hover:text-gray-900 p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                  {item.label}
                  {item.path === "/dashboard" && getTotalUnreadMessages() > 0 && (
                    <NotificationBadge count={getTotalUnreadMessages()} className="ml-2" />
                  )}
                </div>
              </button>
            ))}

            {!currentUser && (
              <>
                <button
                  onClick={() => {
                    showLoginModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left bg-warm-olive text-white px-3 py-2 rounded-md text-base font-medium hover:bg-cool-olive"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    showRegisterModal();
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
