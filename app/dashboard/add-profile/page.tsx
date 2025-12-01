// app/dashboard/add-profile/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Asterisk } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import PhotoSection from "@/components/profile/PhotoSection";
import { SpinnerRoundFilled } from "spinners-react";
import DateInput from "@/components/DateInput";
import { collection, getDocs } from "firebase/firestore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store/useStore";

const RequiredFieldMarker = () => (
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="text-[#b34c4c] text-base leading-none align-middle ml-0.1 inline-flex" style={{ position: "relative", top: "-5px" }}>
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
  const [isCreating, setIsCreating] = useState(false);
  const { createProfile } = useStore();
  const router = useRouter();

  const handlePhotoChange = (base64: string, file: File) => {
    setPhotoURL(base64);
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Voornaam en achternaam zijn verplicht");
      return;
    }
    if (!birthdate) {
      toast.error("Geboortedatum is verplicht");
      return;
    }

    setIsCreating(true);

    try {
      const profilesSnapshot = await getDocs(collection(db, "profiles"));
      let avatarURL: string | undefined;

      if (imageFile) {
        const storageRef = ref(storage, `public/profilePictures/${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        avatarURL = await getDownloadURL(snapshot.ref);
      }

      await createProfile(
        firstName,
        lastName,
        `profile${profilesSnapshot.docs.length + 1}`,
        birthdate,
        gender,
        address,
        avatarURL
      );

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Profiel toevoegen mislukt.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {isCreating && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <SpinnerRoundFilled size={69} thickness={180} speed={100} color="rgba(79, 172, 57, 1)" />
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-10 p-6 border border-gray-300 shadow-sm rounded-md bg-white">
        <h1 className="text-2xl font-bold mb-4">Voeg Profiel Toe</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                Voornaam
                <RequiredFieldMarker />
              </Label>
              <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lastName">
                Achternaam
                <RequiredFieldMarker />
              </Label>
              <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">
              Gender
              <RequiredFieldMarker />
            </Label>
            <select required id="gender" className="border rounded-md p-2 w-full" onChange={(e) => setGender(e.target.value)}>
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="not_say">Prefer not to say</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Land</Label>
              <Input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
            <div>
              <Label>
                Locatie
                <RequiredFieldMarker />
              </Label>
              <Input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
            </div>
          </div>

          <div className="my-4">
            <DateInput required id="birthdate" label="Geboortedatum" value={birthdate} onChange={(val) => setBirthdate(val)} maxDate={new Date().toISOString().split("T")[0]} isRequired />
          </div>

          <PhotoSection photoURL={photoURL || undefined} onPhotoChange={handlePhotoChange} />

          <div className="flex items-center justify-between mt-6">
            <button type="button" onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition-colors">
              Annuleer
            </button>
            <button type="submit" className="px-4 py-2 bg-accent hover:bg-chart-5 text-white rounded-md">
              Voeg Profiel Toe
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
