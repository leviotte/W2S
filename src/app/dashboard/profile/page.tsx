// src/app/dashboard/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SpinnerRoundFilled } from "spinners-react";

import { useStore } from "@/src/lib/store/useStore";
import PhotoSection from "@/src/components/profile/PhotoSection";
import PersonalInfoSection from "@/src/components/profile/PersonalInfoSection";
import AddressSection from "@/src/components/profile/AddressSection";
import PasswordChangeSection from "@/src/components/PasswordChangeSection";
import ShareProfileSection from "@/src/components/profile/ShareProfileSection";
import { Switch } from "@/src/components/ui/switch";

import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // pas aan als jouw firebase client init op een andere plek staat

interface FormData {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  photoURL?: string | null;
  avatarURL?: string | null;
  managers?: any[];
  address: {
    street: string;
    number: string;
    box: string;
    postalCode: string;
    city: string;
  };
}

export default function Page() {
  const router = useRouter();
  const {
    currentUser,
    updateUserProfile,
    updateProfile,
    togglePublicStatus,
    // deleteAccount, deleteProfile, switchToProfile etc. live in store if present
  } = useStore();

  // UI state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({
    photo: false,
    personal: false,
    address: false,
    managers: false,
  });

  // activeProfile from localStorage (same logic as your old app)
  const activeProfileId =
    typeof window !== "undefined" ? localStorage.getItem("activeProfile") : null;
  const isProfile = activeProfileId !== "main-account";

  // initial form state (pull from currentUser where available)
  const [formData, setFormData] = useState<FormData>({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    birthdate: currentUser?.birthdate || "",
    photoURL: currentUser?.photoURL,
    avatarURL: currentUser?.avatarURL,
    managers: [],
    address:
      currentUser?.address || {
        street: "",
        number: "",
        box: "",
        postalCode: "",
        city: "",
      },
  });

  // Realtime listener for active profile (when switching to a child profile)
  useEffect(() => {
    if (!isProfile || !activeProfileId) return;

    const profileRef = doc(db, "profiles", activeProfileId);

    const unsub = onSnapshot(
      profileRef,
      (snap) => {
        if (!snap.exists()) {
          toast.error("Geen profiel gevonden");
          return;
        }
        const data = snap.data();
        setFormData((prev) => ({
          ...prev,
          managers: data.managers || [],
          birthdate: data.birthdate || "",
          avatarURL: data.avatarURL || prev.avatarURL,
          address: data.address || prev.address,
          phone: data.phone || prev.phone,
          name: data.name || prev.name,
        }));
      },
      (err) => {
        console.error("Profile snapshot error:", err);
        toast.error("Kon profielupdates niet laden");
      }
    );

    return () => unsub();
  }, [activeProfileId, isProfile]);

  // Handlers
  const handlePhotoSubmit = async () => {
    try {
      setIsSubmitting((s) => ({ ...s, photo: true }));
      if (isProfile) {
        if (!activeProfileId) throw new Error("Active profile ID ontbreekt");
        await updateProfile(activeProfileId, { avatarURL: formData.avatarURL });
      } else {
        await updateUserProfile({ photoURL: formData.photoURL });
      }
      toast.success("Foto opgeslagen");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Fout bij opslaan foto");
    } finally {
      setIsSubmitting((s) => ({ ...s, photo: false }));
    }
  };

  const handlePersonalInfoSubmit = async () => {
    if (
      !formData.firstName?.trim() ||
      !formData.lastName?.trim() ||
      !formData.email?.trim() ||
      !formData.birthdate
    ) {
      toast.error("Vul alle verplichte velden in.");
      return;
    }
    try {
      setIsSubmitting((s) => ({ ...s, personal: true }));
      if (isProfile) {
        if (!activeProfileId) throw new Error("Active profile ID ontbreekt");
        await updateProfile(activeProfileId, {
          name: formData.name,
          phone: formData.phone,
          birthdate: formData.birthdate,
        });
      } else {
        await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birthdate: formData.birthdate,
        });
      }
      toast.success("Persoonlijke gegevens opgeslagen");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Fout bij opslaan persoonlijke gegevens");
    } finally {
      setIsSubmitting((s) => ({ ...s, personal: false }));
    }
  };

  const handleAddressSubmit = async () => {
    try {
      setIsSubmitting((s) => ({ ...s, address: true }));
      if (isProfile) {
        if (!activeProfileId) throw new Error("Active profile ID ontbreekt");
        await updateProfile(activeProfileId, { address: formData.address });
      } else {
        await updateUserProfile({ address: formData.address });
      }
      toast.success("Adres opgeslagen");
    } catch (err) {
      console.error(err);
      toast.error("Fout bij opslaan adres");
    } finally {
      setIsSubmitting((s) => ({ ...s, address: false }));
    }
  };

  const handleAddManager = async (newManager: any) => {
    try {
      setIsSubmitting((s) => ({ ...s, managers: true }));
      if (!activeProfileId) throw new Error("Active profile ID ontbreekt");

      const managerRef = doc(db, "users", newManager.id);
      const snap = await getDoc(managerRef);
      if (!snap.exists()) throw new Error("Manager niet gevonden");

      const managerData = snap.data();
      const existing = managerData?.profiles || [];
      if (!existing.includes(activeProfileId)) {
        await updateDoc(managerRef, { profiles: arrayUnion(activeProfileId) });
      }

      const updatedManagers = [...(formData.managers || []), newManager];
      await updateProfile(activeProfileId, { managers: updatedManagers });

      setFormData((f) => ({ ...f, managers: updatedManagers }));
      toast.success("Manager toegevoegd");
    } catch (err) {
      console.error(err);
      toast.error("Kon manager niet toevoegen");
    } finally {
      setIsSubmitting((s) => ({ ...s, managers: false }));
    }
  };

  const handleRemoveManager = async (managerId: string) => {
    try {
      setIsSubmitting((s) => ({ ...s, managers: true }));
      if (!activeProfileId) throw new Error("Active profile ID ontbreekt");

      const managerRef = doc(db, "users", managerId);
      const snap = await getDoc(managerRef);
      if (snap.exists()) {
        await updateDoc(managerRef, { profiles: arrayRemove(activeProfileId) });
      }

      const updatedManagers = (formData.managers || []).filter(
        (m) => m.id !== managerId
      );
      await updateProfile(activeProfileId, { managers: updatedManagers });
      setFormData((f) => ({ ...f, managers: updatedManagers }));
      toast.success("Manager verwijderd");
    } catch (err) {
      console.error(err);
      toast.error("Kon manager niet verwijderen");
    } finally {
      setIsSubmitting((s) => ({ ...s, managers: false }));
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setIsToggling(true);
      if (isProfile) {
        if (!activeProfileId) throw new Error("Active profile ID ontbreekt");
        await togglePublicStatus(true, activeProfileId);
      } else {
        await togglePublicStatus(false);
      }
      toast.success("Zichtbaarheid aangepast");
    } catch (err) {
      console.error(err);
      toast.error("Kon zichtbaarheid niet aanpassen");
    } finally {
      setIsToggling(false);
    }
  };

  // small helpers to bind fields
  const handlePersonalFieldChange = (
    field:
      | "firstName"
      | "lastName"
      | "name"
      | "email"
      | "phone"
      | "birthdate",
    value: string
  ) => setFormData((f) => ({ ...f, [field]: value }));

  const handleAddressFieldChange = (
    field: keyof FormData["address"],
    value: string
  ) =>
    setFormData((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  // render
  return (
    <>
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <SpinnerRoundFilled size={80} color="rgba(96,108,56,1)" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-accent mb-6">My Profile</h1>

        {/* Photo section */}
        <div className="mb-6">
          <PhotoSection
            photoURL={isProfile ? formData.avatarURL : formData.photoURL}
            onPhotoChange={(url) => {
              if (isProfile) setFormData((f) => ({ ...f, avatarURL: url }));
              else setFormData((f) => ({ ...f, photoURL: url }));
            }}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handlePhotoSubmit}
              disabled={isSubmitting.photo}
              className="bg-warm-olive text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {isSubmitting.photo ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Personal info */}
        <div className="mb-6">
          <PersonalInfoSection
            data={{
              firstName: formData.firstName,
              lastName: formData.lastName,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              birthdate: formData.birthdate,
              isProfile,
            }}
            onChange={(field, val) => handlePersonalFieldChange(field as any, val)}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handlePersonalInfoSubmit}
              disabled={isSubmitting.personal}
              className="bg-warm-olive text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {isSubmitting.personal ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddressSubmit();
            }}
          >
            <AddressSection
              address={formData.address}
              onChange={(field, val) => handleAddressFieldChange(field, val)}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={isSubmitting.address}
                className="bg-warm-olive text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isSubmitting.address ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Managers */}
        {isProfile && (
          <div className="mb-6">
            <ShareProfileSection
              profileId={activeProfileId || ""}
              managers={formData.managers || []}
              onAddManager={handleAddManager}
              onRemoveManager={handleRemoveManager}
            />
          </div>
        )}

        {/* Password for main account */}
        {!isProfile && <PasswordChangeSection />}

        {/* Visibility toggle */}
        <div className="flex items-center justify-between my-6 bg-gray-100 p-6 rounded-xl shadow">
          <h2 className="font-medium text-accent">
            {isProfile ? "Profile Visibility" : "Account Visibility"}
          </h2>

          <div className="flex items-center gap-3">
            <Switch
              checked={Boolean(currentUser?.isPublic)}
              onClick={handleToggleVisibility}
              disabled={isToggling}
            />
            <span className="text-sm">{currentUser?.isPublic ? "Public" : "Private"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
