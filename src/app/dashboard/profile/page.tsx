// src/app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/use-auth-store";

// Importeer de componenten die we gebruiken
import PhotoSection from "@/components/profile/PhotoSection";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import AddressSection from "@/components/profile/AddressSection";
import { PasswordChangeSection } from "@/app/dashboard/settings/_components/password-change-section";
import ShareProfileSection from "@/components/profile/ShareProfileSection"; // We voegen deze terug toe!
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SpinnerRoundFilled } from "spinners-react";

// Importeer de types
import type { UserProfile, Address, SubProfile } from '@/types/user';

// Dit wordt onze lokale state voor het formulier, afgeleid van de store
type FormState = Partial<UserProfile & SubProfile & { avatarURL?: string }>;

export default function ProfilePage() {
  const router = useRouter();

  // Haal alles wat we nodig hebben uit de GOUDSTANDAARD store
  const {
    currentUser,
    profiles,
    loading,
    updateUserProfile,
    updateSubProfile,
    togglePublicStatus,
    activeProfileId,
  } = useAuthStore((state) => ({
    currentUser: state.currentUser,
    profiles: state.profiles, // We hebben de lijst met subprofielen nodig
    loading: state.loading,
    updateUserProfile: state.updateUserProfile,
    updateSubProfile: state.updateSubProfile,
    togglePublicStatus: state.togglePublicStatus,
    activeProfileId: state.activeProfileId,
  }));

  const [isProfile, setIsProfile] = useState(false);
  const [formData, setFormData] = useState<FormState>({});
  
  // Dit effect bepaalt welk profiel we tonen en vult het formulier
  useEffect(() => {
    const isSubProfile = activeProfileId !== null && activeProfileId !== currentUser?.id;
    setIsProfile(isSubProfile);

    if (isSubProfile) {
      const activeSubProfile = profiles.find(p => p.id === activeProfileId);
      setFormData(activeSubProfile || {});
    } else if (currentUser) {
      setFormData(currentUser);
    }
  }, [currentUser, profiles, activeProfileId]);

  // Generieke handler om elk veld in onze lokale state aan te passen
  const handleFieldChange = useCallback((field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Generieke handler voor adres-velden
  const handleAddressFieldChange = useCallback((field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...(prev.address || {}), [field]: value } as Address,
    }));
  }, []);
  
  // Generieke submit handler die de logica delegeert aan de store
  const handleSectionSubmit = async (data: Partial<FormState>) => {
    if (isProfile && activeProfileId) {
      await updateSubProfile(activeProfileId, data);
    } else {
      await updateUserProfile(data);
    }
  };

  // Render een laad-status als de store bezig is of de gebruiker nog niet geladen is
  if (loading && !currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <SpinnerRoundFilled size={80} color="rgba(96,108,56,1)" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-accent mb-6">Profiel Bewerken</h1>

      {/* --- FOTO SECTIE --- */}
      <div className="mb-6">
        <PhotoSection
          photoURL={isProfile ? formData.avatarURL : formData.photoURL ?? undefined}
          onChange={(url) => handleFieldChange(isProfile ? 'avatarURL' : 'photoURL', url)}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={() => handleSectionSubmit({ photoURL: formData.photoURL, avatarURL: formData.avatarURL })} disabled={loading}>
            {loading ? "Opslaan..." : "Foto Opslaan"}
          </Button>
        </div>
      </div>

      {/* --- PERSOONLIJKE INFO SECTIE --- */}
      <div className="mb-6">
        <PersonalInfoSection
          data={{ ...formData, isProfile }}
          onFieldChange={(field, val) => handleFieldChange(field as keyof FormState, val)}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={() => handleSectionSubmit({ firstName: formData.firstName, lastName: formData.lastName, name: formData.name, email: formData.email, phone: formData.phone, birthdate: formData.birthdate })} disabled={loading}>
            {loading ? "Opslaan..." : "Gegevens Opslaan"}
          </Button>
        </div>
      </div>

      {/* --- ADRES SECTIE --- */}
      <div className="mb-6">
        <AddressSection
          address={formData.address as Address}
          onFieldChange={handleAddressFieldChange}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={() => handleSectionSubmit({ address: formData.address })} disabled={loading}>
            {loading ? "Opslaan..." : "Adres Opslaan"}
          </Button>
        </div>
      </div>

      {/* --- MANAGERS SECTIE (enkel voor subprofielen) --- */}
      {isProfile && activeProfileId && (
        <div className="mb-6">
          {/* DELEGATIE: Dit component beheert ZIJN EIGEN logica. We geven enkel het ID mee. */}
          <ShareProfileSection profileId={activeProfileId} />
        </div>
      )}

      {/* --- WACHTWOORD SECTIE (enkel voor hoofdaccount) --- */}
      {!isProfile && <PasswordChangeSection />}

      {/* --- ZICHTBAARHEID SECTIE --- */}
      <div className="flex items-center justify-between my-6 bg-gray-100 p-6 rounded-xl shadow">
        <h2 className="font-medium text-accent">
          Profiel Zichtbaarheid
        </h2>
        <div className="flex items-center gap-3">
          <Switch
            checked={!!formData.isPublic}
            onCheckedChange={(isChecked) => togglePublicStatus(isProfile, isProfile ? activeProfileId : undefined)}
            disabled={loading}
          />
          <span className="text-sm">{formData.isPublic ? "Publiek" : "Privé"}</span>
        </div>
      </div>
    </div>
  );
}