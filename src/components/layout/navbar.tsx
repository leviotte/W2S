// src/components/layout/navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Search,
  ChevronDown,
  CircleUserRound,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/client/firebase";

interface Profile {
  id: string;
  name: string;
  avatarURL?: string;
  mainAccount?: boolean;
}

export function Navbar() {
  const router = useRouter();
  
  // ✅ Zustand auth store
  const currentUser = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("main-account");

  // ✅ Load profiles from Firestore (alleen als currentUser bestaat)
  useEffect(() => {
    if (!currentUser?.id) {
      setProfiles([]);
      return;
    }

    const loadProfiles = async () => {
      try {
        const { collection, query, where, or, onSnapshot, getFirestore } = await import("firebase/firestore");
        const db = getFirestore();

        const profilesQuery = query(
          collection(db, "profiles"),
          or(
            where("createdBy", "==", currentUser.id),
            where("managers", "array-contains", currentUser.id)
          )
        );

        const unsubscribe = onSnapshot(profilesQuery, (snapshot) => {
          const allProfiles = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            avatarURL: doc.data().avatarURL,
          }));

          const mainAccountProfile: Profile = {
            id: "main-account",
            name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || "Main Account",
            avatarURL: currentUser.photoURL || undefined,
            mainAccount: true,
          };

          setProfiles([mainAccountProfile, ...allProfiles]);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Failed to load profiles:", error);
      }
    };

    loadProfiles();
  }, [currentUser?.id]);

  // ✅ Load active profile from localStorage
  useEffect(() => {
    const savedProfileId = localStorage.getItem("activeProfile");
    if (savedProfileId) {
      setActiveProfileId(savedProfileId);
    }
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleProfileSwitch = (profileId: string) => {
    setActiveProfileId(profileId);
    localStorage.setItem("activeProfile", profileId);
    router.refresh();
  };

  // ✅ COMPLETE LOGOUT - past bij jouw setup
  const handleLogout = async () => {
    try {
      console.log("[Navbar] 🔓 Logging out...");
      
      // 1. Firebase signOut
      await auth.signOut();
      
      // 2. Server-side session clearing (jouw bestaande API)
      await fetch('/api/logout', { method: 'POST' });
      
      // 3. Clear Zustand state
      setCurrentUser(null);
      
      // 4. Clear localStorage
      localStorage.removeItem("activeProfile");
      
      // 5. Clear profiles
      setProfiles([]);
      setActiveProfileId("main-account");
      
      // 6. Close mobile menu
      setIsMenuOpen(false);
      
      // 7. Redirect
      router.push("/");
      router.refresh();
      
      console.log("[Navbar] ✅ Logout complete");
    } catch (error) {
      console.error("[Navbar] ❌ Logout failed:", error);
    }
  };

  const menuItems = currentUser
    ? [
        { label: "Dashboard", path: "/dashboard", icon: Home },
        ...(currentUser.isAdmin
          ? [{ label: "Admin", path: "/admin", icon: Home }]
          : []),
        { label: "Zoek vrienden", path: "/search", icon: Search },
      ]
    : [];

  return (
    <nav className="bg-gray-100 shadow-sm">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
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
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {item.icon && <item.icon className="h-5 w-5 mr-1" />}
                {item.label}
              </Link>
            ))}

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 ml-4">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {activeProfile?.avatarURL ? (
                        <img
                          src={activeProfile.avatarURL}
                          alt={activeProfile.name}
                          className="h-8 w-8 object-cover rounded-full"
                        />
                      ) : (
                        <CircleUserRound className="h-8 w-8" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeProfile?.name || currentUser.firstName}
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
                  {profiles.map((profile) => (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleProfileSwitch(profile.id)}
                      className={`gap-2 p-2 ${
                        profile.mainAccount ? "font-bold text-accent" : ""
                      } ${activeProfileId === profile.id ? "bg-accent/10" : ""}`}
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
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard?tab=add-profile")}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-accent">
                      <Plus className="size-4 text-white" />
                    </div>
                    <div className="font-medium">Voeg profiel toe</div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard?tab=profile")}
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

            {!currentUser && (
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
                  className="border-warm-olive text-warm-olive"
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
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                  {item.label}
                </div>
              </Link>
            ))}

            {!currentUser && (
              <div className="flex flex-col gap-2 px-3 pt-2">
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
                  className="w-full border-warm-olive text-warm-olive"
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