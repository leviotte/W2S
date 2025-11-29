"use client";

import {
  ChevronsUpDown,
  CircleUserRound,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface User {
  id: string;
  firstName?: string;
  name?: string;
  photoURL?: string;
}

interface Profile {
  id: string;
  name: string;
  avatarURL?: string | null;
  createdBy?: string;
  managers?: string[];
  mainAccount?: boolean;
  isManaged?: boolean;
}

export function TeamSwitcher({ user }: { user: User }) {
  const userId = user?.id;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const router = useRouter();
  const { switchToProfile } = useStore();

  // ---------------------------------------------------------------------------
  // Load Profiles
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    // Firestore does not support 'or' queries in all SDKs, so we combine manually
    const createdByQuery = query(
      collection(db, "profiles"),
      where("createdBy", "==", userId)
    );

    const managedQuery = query(
      collection(db, "profiles"),
      where("managers", "array-contains", userId)
    );

    const unsubscribeCreatedBy = onSnapshot(createdByQuery, (snapshot) => {
      const createdByProfiles: Profile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return { id: doc.id, ...data, isManaged: data.createdBy !== userId };
      });

      setProfiles((prev) => mergeProfiles(prev, createdByProfiles));
    });

    const unsubscribeManaged = onSnapshot(managedQuery, (snapshot) => {
      const managedProfiles: Profile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return { id: doc.id, ...data, isManaged: data.createdBy !== userId };
      });

      setProfiles((prev) => mergeProfiles(prev, managedProfiles));
    });

    // Main account entry
    const mainProfile: Profile = {
      id: "main-account",
      name: user.firstName || user.name || "Main Account",
      avatarURL: user.photoURL ?? null,
      mainAccount: true,
    };

    // Restore active profile
    const saved = localStorage.getItem("activeProfile");
    if (saved && saved !== "main-account") {
      const found = [...profiles].find((p) => p.id === saved);
      setActiveProfile(found || mainProfile);
    } else {
      setActiveProfile(mainProfile);
    }

    return () => {
      unsubscribeCreatedBy();
      unsubscribeManaged();
    };
  }, [userId]);

  const mergeProfiles = (prev: Profile[], next: Profile[]) => {
    const combined = [...prev, ...next];
    // Remove duplicates by id
    const map = new Map<string, Profile>();
    combined.forEach((p) => map.set(p.id, p));
    const finalList = [ 
      {
        id: "main-account",
        name: user?.firstName || user?.name || "Main Account",
        avatarURL: user?.photoURL ?? null,
        mainAccount: true,
      },
      ...Array.from(map.values())
    ];
    useStore.getState().setProfiless(finalList);
    return finalList;
  };

  // ---------------------------------------------------------------------------
  // Switch Profile
  // ---------------------------------------------------------------------------

  const handleProfileSwitch = async (profileId: string) => {
    try {
      if (profileId === "main-account") {
        setActiveProfile(null);
        await switchToProfile(null, router);
        return;
      }

      const selected = profiles.find((p) => p.id === profileId);
      if (!selected) return;

      setActiveProfile(selected);
      await switchToProfile(profileId, router);
    } catch (err) {
      console.error("Profile switch failed:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // Add Profile
  // ---------------------------------------------------------------------------

  const handleAddProfile = () => {
    router.push("/dashboard?tab=add-profile");
  };

  const avatar = activeProfile?.avatarURL || user?.photoURL || null;
  const activeName = activeProfile?.name || user?.firstName || user?.name || "Select Profile";

  // ---------------------------------------------------------------------------
  // Component Output
  // ---------------------------------------------------------------------------

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {avatar ? (
              <img
                src={avatar}
                alt={activeName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <CircleUserRound className="h-8 w-8" />
            )}
          </div>

          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeName}</span>
          </div>

          <ChevronsUpDown className="ml-auto" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[200px]" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Profielen</DropdownMenuLabel>

        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => handleProfileSwitch(p.id)}
            className={`gap-2 p-2 ${p.mainAccount ? "font-bold text-accent" : ""}`}
          >
            <div className="flex items-center space-x-2">
              {p.avatarURL ? (
                <img
                  src={p.avatarURL}
                  alt={p.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <CircleUserRound className="h-6 w-6" />
              )}
              <span>{p.name}</span>
            </div>
          </DropdownMenuItem>
        ))}

        {(activeProfile?.id === "main-account" || !activeProfile) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddProfile} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-accent">
                <Plus className="size-4 text-white" />
              </div>
              <span className="font-medium">Voeg profiel toe</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
