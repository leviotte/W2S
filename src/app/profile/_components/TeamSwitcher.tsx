// src/app/profile/_components/TeamSwitcher.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleUserRound, Plus, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { auth, getClientFirestore } from "@/lib/client/firebase";
import { collection, query, where, or, onSnapshot } from "firebase/firestore";

interface Profile {
  id: string;
  name: string;
  avatarURL?: string;
  mainAccount?: boolean;
}

export function TeamSwitcher() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("main-account");

  useEffect(() => {
    if (!currentUser?.id) {
      setProfiles([]);
      return;
    }

    const db = getClientFirestore();

    const profilesQuery = query(
      collection(db, "profiles"),
      or(
        where("createdBy", "==", currentUser.id),
        where("managers", "array-contains", currentUser.id)
      )
    );

    const unsubscribe = onSnapshot(
      profilesQuery,
      (snapshot) => {
        const allProfiles = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.displayName || "Unknown",
            avatarURL: data.avatarURL || data.photoURL,
          };
        });

        const mainAccountProfile: Profile = {
          id: "main-account",
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || "Main Account",
          avatarURL: currentUser.photoURL || undefined,
          mainAccount: true,
        };

        setProfiles([mainAccountProfile, ...allProfiles]);
      },
      (error) => console.error("Firestore snapshot error:", error)
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  useEffect(() => {
    const savedProfileId = localStorage.getItem("activeProfile");
    if (savedProfileId) setActiveProfileId(savedProfileId);
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleProfileSwitch = (profileId: string) => {
    setActiveProfileId(profileId);
    document.cookie = `activeProfile=${profileId}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch('/api/logout', { method: 'POST' });
      setCurrentUser(null);
      localStorage.removeItem("activeProfile");
      setProfiles([]);
      setActiveProfileId("main-account");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 ml-4 hover:opacity-80 transition-opacity">
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
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Profielen ({profiles.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleProfileSwitch(profile.id)}
            className={`gap-2 p-2 cursor-pointer ${profile.mainAccount ? "font-bold" : ""} ${activeProfileId === profile.id ? "bg-accent/10" : ""}`}
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

        {activeProfileId === "main-account" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/add-profile")}
              className="gap-2 p-2 cursor-pointer"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-accent">
                <Plus className="size-4 text-white" />
              </div>
              <div className="font-medium">Voeg profiel toe</div>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="gap-2 p-2 cursor-pointer"
        >
          <Settings className="h-4 w-4" />
          Instellingen
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 p-2 text-[#b34c4c] cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log Uit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
