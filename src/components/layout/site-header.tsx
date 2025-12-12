import Link from "next/link";
import { MainNav } from "./main-nav";
import TeamSwitcher from "../shared/TeamSwitcher";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from '@/lib/auth/actions';
import { getManagedProfiles } from "@/lib/server/data/users";

export async function SiteHeader() {
  const user = await getCurrentUser();
  
  // ✅ FIXED: getManagedProfiles returns SubProfile[], but TeamSwitcher expects UserProfile[]
  // We'll pass an empty array for now since managed profiles are sub-profiles, not full user profiles
  const subProfiles = user ? await getManagedProfiles(user.id) : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                {/* ✅ FIXED: Pass subProfiles as-is */}
                <TeamSwitcher user={user} profiles={subProfiles} />
              </>
            ) : (
              <>
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