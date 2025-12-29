// src/app/dashboard/add-profile/page.tsx
import { AddProfileForm } from "@/app/profile/_components/AddProfileForm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Voeg Profiel Toe - Wish2Share",
  description: "Maak een nieuw sub-profiel aan",
};

export default async function AddProfilePage() {
  const session = await getSession();

  if (!session.user.isLoggedIn) {
    redirect("/");
  }

  return <AddProfileForm />;
}