// src/app/dashboard/add-profile/page.tsx
import { AddProfileForm } from "@/app/profile/_components/AddProfileForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Voeg Profiel Toe - Wish2Share",
  description: "Maak een nieuw sub-profiel aan",
};

export default async function AddProfilePage() {
  // Haal sessie op via NextAuth
  const session = await getServerSession(authOptions);

  // Redirect als gebruiker niet ingelogd is
  if (!session?.user?.id) {
    redirect("/");
  }

  return <AddProfileForm />;
}
