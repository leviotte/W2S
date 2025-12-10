// src/app/dashboard/add-profile/page.tsx
'use client'; // Dit bestand bevat formulierinteractie

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { addProfile, type AddProfileFormState } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from '@/components/ui/submit-button';

const initialState: AddProfileFormState = {
  success: false,
  message: "",
};

export default function AddProfilePage() {
  const router = useRouter();
  const [state, formAction] = useFormState(addProfile, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Succes!", { description: state.message });
      // Stuur gebruiker terug naar het dashboard waar ze het nieuwe profiel kunnen zien
      router.push('/dashboard'); 
    } else if (state.message && state.message !== "") {
      toast.error("Fout", { description: state.message });
    }
  }, [state, router]);

  return (
    <div className="container mx-auto max-w-xl p-4 sm:p-8">
      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>Nieuw Profiel Toevoegen</CardTitle>
            <CardDescription>
              Maak een sub-profiel aan dat je kunt beheren. Dit is handig voor familieleden zonder eigen account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input id="firstName" name="firstName" placeholder="Jan" required />
              {state.errors?.firstName && <p className="text-sm text-destructive">{state.errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input id="lastName" name="lastName" placeholder="Peeters" required />
               {state.errors?.lastName && <p className="text-sm text-destructive">{state.errors.lastName}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton>Profiel Aanmaken</SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}