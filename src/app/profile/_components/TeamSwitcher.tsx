// src/app/profile/_components/TeamSwitcher.tsx
import { cookies } from "next/headers";
import { TeamSwitcherClient } from "./TeamSwitcher.client";
import { getProfilesForUser } from "@/modules/profiles/profiles.server";
import type { UserProfile } from "@/types/user";

interface Props {
  serverUser: UserProfile;
}

export async function TeamSwitcher({ serverUser }: Props) {
  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get("activeProfile")?.value ?? "main-account";

  const profiles = await getProfilesForUser(serverUser.id);

  const mainProfile = {
    id: "main-account",
    name:
      `${serverUser.firstName ?? ""} ${serverUser.lastName ?? ""}`.trim() ||
      serverUser.email,
    avatarURL: serverUser.photoURL ?? undefined,
    mainAccount: true,
  };

  return (
    <TeamSwitcherClient
      user={serverUser}
      profiles={[mainProfile, ...profiles]}
      activeProfileId={activeProfileId}
    />
  );
}
