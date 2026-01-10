"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleUserRound,
  Plus,
  Settings,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  name: string;
  avatarURL?: string;
  mainAccount?: boolean;
}

interface Props {
  user: {
    email: string;
  };
  profiles: Profile[];
  activeProfileId: string;
}

export function TeamSwitcherClient({
  user,
  profiles,
  activeProfileId,
}: Props) {
  const router = useRouter();
  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const switchProfile = async (profileId: string) => {
    await fetch("/api/profile/switch", {
      method: "POST",
      body: JSON.stringify({ profileId }),
    });
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 ml-4">
          <div className="size-8 rounded-full overflow-hidden">
            {activeProfile.avatarURL ? (
              <img src={activeProfile.avatarURL} alt="" />
            ) : (
              <CircleUserRound />
            )}
          </div>
          <div className="text-left text-sm">
            <div className="font-semibold truncate">{activeProfile.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Profielen ({profiles.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profiles.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => switchProfile(p.id)}>
            {p.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Instellingen
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log uit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
