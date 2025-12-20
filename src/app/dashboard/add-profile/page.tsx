// src/app/dashboard/add-profile/page.tsx
import { AddProfileForm } from "@/components/profile/AddProfileForm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Voeg Profiel Toe - Wish2Share",
  description: "Maak een nieuw sub-profiel aan",
};

export default async function AddProfilePage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  return <AddProfileForm />;
}