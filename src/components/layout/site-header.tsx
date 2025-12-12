// src/components/layout/site-header.tsx
import Link from "next/link";
import { MainNav } from "./main-nav";
import TeamSwitcher from "../shared/TeamSwitcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from '@/lib/auth/actions';
import { getManagedProfiles } from "@/lib/server/data/users";

export async function SiteHeader() {
  // Server-side data fetching - geen loading states nodig!
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
                {/* Server data direct als props doorgeven */}
                <TeamSwitcher user={user} profiles={profiles} />
              </>
            ) : (
              <>
                {/* ✅ NIEUWE LOGIN/REGISTER BUTTONS (zonder modal) */}
                <Button variant="ghost" asChild>
                  <Link href="/login">Inloggen</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registreren</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}