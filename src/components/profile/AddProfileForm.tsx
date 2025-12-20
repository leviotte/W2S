// src/components/profile/AddProfileForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Asterisk } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoSection } from "./PhotoSection";
import { DateInput } from "@/components/profile/DateInput";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/loading-spinner";
import { createSubProfileAction } from "@/lib/server/actions/subprofile-actions"; // ✅ GEBRUIK BESTAANDE ACTION

const RequiredFieldMarker = () => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="text-[#b34c4c] text-base leading-none align-middle ml-0.5 inline-flex"
            style={{ position: "relative", top: "-5px" }}
          >
            <Asterisk
              className="h-4 w-4 cursor-pointer"
              style={{ transform: "rotate(-30deg)" }}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-slate-50 text-chart-5 text-xs z-50 rounded-md py-2 px-2 shadow-lg"
            sideOffset={1}
            side="right"
          >
            Dit veld is nodig
            <Tooltip.Arrow className="fill-slate-50" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export function AddProfileForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState({
    city: "",
    country: "",
  });
  const [isCreating, setIsCreating] = useState(false);

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

    if (!address.city) {
      toast.error("Locatie is verplicht");
      return;
    }

    setIsCreating(true);

    try {
      let avatarURL: string | null = null;

      // Upload image to Firebase Storage if selected
      if (imageFile) {
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const { storage } = await import("@/lib/client/firebase");
        
        const storageRef = ref(storage, `public/profilePictures/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        avatarURL = await getDownloadURL(snapshot.ref);
      }

      // ✅ GEBRUIK BESTAANDE ACTION
      const result = await createSubProfileAction({
        firstName,
        lastName,
        birthdate,
        gender: gender || undefined,
        address,
        photoURL: avatarURL,
      });

      if (result.success) {
        toast.success(`Profiel voor ${firstName} is succesvol aangemaakt!`);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error || "Kon profiel niet aanmaken");
      }
    } catch (error) {
      console.error("Error adding profile:", error);
      toast.error("Profiel toevoegen mislukt.");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePhotoChange = (photoBase64: string, file: File) => {
    setPhotoURL(photoBase64);
    setImageFile(file);
  };

  return (
    <>
      {isCreating && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-accent" />
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-10 p-6 border border-gray-300 shadow-sm rounded-md bg-white">
        <h1 className="text-2xl font-bold mb-4">Voeg Profiel Toe</h1>
        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block font-medium mb-2">
                Voornaam
                <RequiredFieldMarker />
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md"
                placeholder="Voornaam"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block font-medium mb-2">
                Achternaam
                <RequiredFieldMarker />
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md"
                placeholder="Achternaam"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div className="grid gap-2 mt-4">
            <Label htmlFor="gender">
              Gender
              <RequiredFieldMarker />
            </Label>
            <select
              required
              onChange={(e) => setGender(e.target.value)}
              id="gender"
              value={gender}
              className="border text-sm border-input rounded-md p-2 focus:outline-none focus:ring-transparent"
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="not_say">Prefer not to say</option>
            </select>
          </div>

          {/* Land & Locatie */}
          <div className="flex items-center gap-2 mt-4 w-full">
            <div className="w-full">
              <Label>Land</Label>
              <Input
                id="country"
                type="text"
                placeholder="Land"
                value={address.country}
                onChange={(e) =>
                  setAddress({
                    ...address,
                    country: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full">
              <Label>
                Locatie
                <RequiredFieldMarker />
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="Locatie"
                value={address.city}
                onChange={(e) =>
                  setAddress({
                    ...address,
                    city: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          {/* Birthdate */}
          <div className="my-4">
            <DateInput
              required
              id="birthdate"
              label="Geboortedatum"
              value={birthdate}
              onChange={(value) => setBirthdate(value)}
              maxDate={new Date().toISOString().split("T")[0]}
              isRequired
            />
          </div>

          {/* Photo Section */}
          <PhotoSection
            photoURL={photoURL || undefined}
            onChange={(base64, file) => handlePhotoChange(base64, file)}
          />

          {/* Buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gray-300 text-gray-900 hover:bg-gray-400 transition-colors rounded-md"
            >
              Annuleer
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-chart-5 text-white rounded-md"
            >
              Voeg Profiel Toe
            </button>
          </div>
        </form>
      </div>
    </>
  );
}