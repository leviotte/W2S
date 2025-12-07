// app/dashboard/add-profile/page.tsx
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Asterisk } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/client/firebase";
import { createSubProfileAction } from "@/lib/actions/profile-actions";
import { useAuthStore } from "@/lib/store/use-auth-store";

import PhotoSection from "@/components/profile/PhotoSection";
import { SpinnerRoundFilled } from "spinners-react";
import DateInput from "@/components/DateInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubProfile } from "@/types/user";

const RequiredFieldMarker = () => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="text-destructive text-base leading-none align-middle ml-0.1 inline-flex relative top-[-5px]">
          <Asterisk className="h-4 w-4 cursor-pointer" style={{ transform: "rotate(-30deg)" }} />
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-slate-50 text-chart-5 text-xs z-50 rounded-md py-2 px-2 shadow-lg" sideOffset={1} side="right">
          Dit veld is nodig
          <Tooltip.Arrow className="fill-slate-50" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export default function AddProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState({ city: "", country: "" });
  
  // Hook voor de state van de server action
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const addSubProfileToState = useAuthStore((state) => state.addSubProfile);

  const handlePhotoChange = (base64: string, file: File) => {
    setPhotoURL(base64);
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadedAvatarURL: string | undefined;

    // Start de pending state
    startTransition(async () => {
      // 1. Upload de afbeelding indien aanwezig
      if (imageFile) {
        try {
          const storageRef = ref(storage, `public/profilePictures/${Date.now()}-${imageFile.name}`);
          const snapshot = await uploadBytes(storageRef, imageFile);
          uploadedAvatarURL = await getDownloadURL(snapshot.ref);
        } catch (uploadError) {
          console.error(uploadError);
          toast.error("Foto uploaden mislukt.");
          return; // Stop als de upload faalt
        }
      }

      // 2. Bereid de data voor
      const profileData = {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        birthdate,
        gender,
        address,
        photoURL: uploadedAvatarURL,
      };

      // 3. Roep de server action aan
      const result = await createSubProfileAction(profileData);

      // 4. Handel het resultaat af
      if (result.success && result.data) {
        // Voeg het nieuwe profiel toe aan de client state
        addSubProfileToState(result.data as SubProfile);
        toast.success("Profiel succesvol aangemaakt!");
        router.push("/dashboard/profile"); // Stuur naar de profiel overzichtspagina
      } else {
        console.error("Server action error:", result.error, result.details);
        toast.error(`Aanmaken mislukt: ${result.error || 'Onbekende fout'}`);
      }
    });
  };

  return (
    <>
      {isPending && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <SpinnerRoundFilled size={69} thickness={180} speed={100} color="rgba(79, 172, 57, 1)" />
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-10 p-6 border border-gray-300 shadow-sm rounded-md bg-white">
        <h1 className="text-2xl font-bold mb-4">Voeg Profiel Toe</h1>
        {/* CORRECTIE: Juiste onSubmit prop */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Voornaam <RequiredFieldMarker /></Label>
              {/* CORRECTIE: Juiste onChange prop */}
              <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lastName">Achternaam <RequiredFieldMarker /></Label>
              <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Geslacht <RequiredFieldMarker /></Label>
            <select required id="gender" className="border rounded-md p-2 w-full" onChange={(e) => setGender(e.target.value)}>
              <option value="">Selecteer geslacht</option>
              <option value="male">Man</option>
              <option value="female">Vrouw</option>
              <option value="not_say">Zeg ik liever niet</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Land</Label>
              <Input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
            <div>
              <Label>Locatie <RequiredFieldMarker /></Label>
              <Input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
            </div>
          </div>

          <div className="my-4">
            <DateInput required id="birthdate" label="Geboortedatum" value={birthdate} onChange={(val) => setBirthdate(val)} maxDate={new Date().toISOString().split("T")[0]} isRequired />
          </div>

          {/* CORRECTIE: Juiste onChange prop */}
          <PhotoSection photoURL={photoURL || undefined} onChange={handlePhotoChange} />

          <div className="flex items-center justify-between mt-6">
            {/* CORRECTIE: Juiste onClick prop */}
            <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/info")}>
              Annuleer
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Aanmaken..." : "Voeg Profiel Toe"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}