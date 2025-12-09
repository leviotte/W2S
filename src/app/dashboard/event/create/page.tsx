// src/app/dashboard/event/create/page.tsx
import 'server-only';
import { getAuthenticatedUserProfile, getManagedProfiles } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import CreateEventForm from "./_components/CreateEventForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function CreateEventPage() {
  const currentUser = await getAuthenticatedUserProfile();
  if (!currentUser) {
    // Stuur niet-ingelogde gebruikers naar de login-pagina
    redirect("/login"); 
  }

  // Haal de profielen op die door de huidige gebruiker worden beheerd
  const managedProfiles = await getManagedProfiles(currentUser.id);
  // Combineer het hoofdprofiel met de beheerde profielen
  const allProfiles = [currentUser, ...managedProfiles];

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
       <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nieuw Evenement Aanmaken</CardTitle>
          <CardDescription>Vul de details in om je nieuwe evenement op te zetten.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Geef de opgehaalde data door als props */}
            <CreateEventForm currentUser={currentUser} profiles={allProfiles} />
        </CardContent>
      </Card>
    </div>
  );
}