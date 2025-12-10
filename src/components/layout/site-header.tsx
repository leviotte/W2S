// src/components/layout/site-header.tsx
import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import TeamSwitcher from "../shared/TeamSwitcher";
import { Button } from "@/components/ui/button";

import { getCurrentUser } from '@/lib/auth/actions';
import { getManagedProfiles } from "@/lib/server/data/users"; // Straks fixen we deze
import AuthModal from "../auth/auth-modal";

export async function SiteHeader() {
  // 1. Haal de data op de server op. Geen client-side loading state meer!
  const user = await getCurrentUser();
  const profiles = user ? await getManagedProfiles(user.id) : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                {/* 2. Geef de server-data door als props aan de client component */}
                <TeamSwitcher user={user} profiles={profiles} />
              </>
            ) : (
              <AuthModal />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}