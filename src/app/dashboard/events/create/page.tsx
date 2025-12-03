"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { useStore } from "@/lib/store/useStore";
import RequiredFieldMarker from "@/components/RequiredFieldMarker";
import { useAuth } from "../../layout";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  confirmed: boolean;
}

interface EventForm {
  name: string;
  date: string;
  time: string;
  budget?: number;
  isLootjesEvent: boolean;
  participantType: "manual" | "self-register";
  registrationDeadline?: string;
  maxParticipants?: number;
  participants: Participant[];
  backgroundImage?: string;
}

interface BackImages {
  id: string;
  imageLink: string;
  title: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent, currentUser, profiles } = useStore();
  const { showLoginModal } = useAuth();

  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState<EventForm>({
    name: "",
    date: "",
    time: "",
    budget: undefined,
    isLootjesEvent: false,
    participantType: "manual",
    registrationDeadline: "",
    maxParticipants: undefined,
    participants: [],
    backgroundImage: "",
  });

  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const EventBackImageCollectionRef = collection(db, "EventBackImages");
  const CategoryCollectionRef = collection(db, "backgroundCategories");

  const profile = localStorage.getItem("activeProfile");
  const isMainProfile = profile === "main-account";
  const profileData = !isMainProfile && profiles.find((i) => i?.id === profile);

  // Organizer always first
  useEffect(() => {
    if (currentUser) {
      setEventData((prevState) => {
        const organizer = {
          id: isMainProfile ? currentUser.id : profileData?.id || "organizer-id",
          firstName: isMainProfile ? currentUser.firstName : profileData?.firstName || "",
          lastName: isMainProfile ? currentUser.lastName : profileData?.lastName || "",
          confirmed: true,
        };
        const otherParticipants = prevState.participants.filter(
          (p) => p.id !== organizer.id
        );
        return { ...prevState, participants: [organizer, ...otherParticipants] };
      });
    }
  }, [currentUser]);

  // Fetch categories & background images
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categorySnap = await getDocs(CategoryCollectionRef);
        const categoriesData: Category[] = categorySnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as any))
          .filter((i: any) => i.type === "event");
        setCategories(categoriesData);

        const imageSnap = await getDocs(EventBackImageCollectionRef);
        const images: BackImages[] = imageSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as any));
        setBackImages(images);
        setFilteredImages(images);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return setFilteredImages(backImages);
    const filtered = backImages.filter((img) => img.category === selectedCategory);
    setFilteredImages(filtered);
    if (backgroundImage && !filtered.some((img) => img.imageLink === backgroundImage)) {
      setBackgroundImage("");
    }
  }, [selectedCategory, backImages]);

  useEffect(() => {
    setEventData((prev) => ({ ...prev, backgroundImage }));
  }, [backgroundImage]);

  const handleNextStep = async (e: FormEvent) => {
    e.preventDefault();

    const makeEvent = async () => {
      const uniqueParticipants = eventData.participants.filter(
        (p, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.id === p.id ||
              `${t.firstName?.trim().toLowerCase()} ${t.lastName?.trim().toLowerCase()}` ===
                `${p.firstName?.trim().toLowerCase()} ${p.lastName?.trim().toLowerCase()}`
          )
      );

      try {
        const eventId = await createEvent({
          name: eventData.name,
          date: eventData.date,
          time: eventData.time,
          budget: eventData.budget,
          isLootjesEvent: eventData.isLootjesEvent,
          registrationDeadline: eventData.registrationDeadline,
          maxParticipants: eventData.maxParticipants || 1000,
          backgroundImage: eventData.backgroundImage,
          participants:
            eventData.participantType === "manual"
              ? uniqueParticipants
              : [
                  {
                    id: isMainProfile ? currentUser?.id : profileData?.id || "",
                    firstName: isMainProfile
                      ? currentUser?.firstName
                      : profileData?.firstName || "",
                    lastName: isMainProfile
                      ? currentUser?.lastName
                      : profileData?.lastName || "",
                    email: currentUser?.email || undefined,
                    confirmed: true,
                  },
                ],
          currentParticipantCount: 1,
          allowSelfRegistration: eventData.participantType === "self-register",
        });

        if (
          eventData.participantType === "manual" &&
          eventData.participants.length > 1
        ) {
          router.push(`/dashboard/event/${eventId}/invites?tab=event&subTab=invites`);
        } else {
          router.push(`/dashboard/event/${eventId}?tab=events&subTab=details`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Er is iets misgegaan bij het aanmaken van het evenement.");
      }
    };

    if (step === 1) {
      if (!eventData.name || !eventData.date) return toast.error("Vul alle verplichte velden in.");
      const eventDateTime = new Date(`${eventData.date}T${eventData.time || "00:00"}`);
      if (eventDateTime < new Date()) return toast.error("Je kunt geen evenement plannen in het verleden.");

      if (eventData.registrationDeadline) {
        const deadline = new Date(eventData.registrationDeadline);
        if (deadline > eventDateTime)
          return toast.error("De registratiedeadline moet vóór de evenementdatum liggen.");
      }

      if (!currentUser) {
        showLoginModal(() => setStep(2));
        return;
      }

      if (eventData.participantType === "self-register") return makeEvent();
      setStep(2);
    } else if (step === 2) {
      if (
        eventData.participantType === "manual" &&
        eventData.participants.length < 3 &&
        eventData.isLootjesEvent
      ) return toast.error("Voeg minimaal 3 deelnemers toe voor een lootjes evenement.");

      const participantNames = eventData.participants.map(
        (p) => `${p.firstName?.trim().toLowerCase()} ${p.lastName?.trim().toLowerCase()}`
      );
      if (participantNames.some((name, idx) => participantNames.indexOf(name) !== idx))
        return toast.error("Dubbele deelnamenamen zijn niet toegestaan.");

      makeEvent();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-accent mb-6">Nieuw evenement</h1>

        <form onSubmit={handleNextStep} className="space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-accent">
                  Naam evenement
                  <RequiredFieldMarker />
                </label>
                <input
                  type="text"
                  value={eventData.name}
                  onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  placeholder="Bijvoorbeeld: Kerst 2025"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-accent">
                    Datum
                    <RequiredFieldMarker />
                  </label>
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent">
                    Tijd
                  </label>
                  <input
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  />
                </div>
              </div>

              <div className="flex items-center w-full justify-between">
                <div className="w-[49%]">
                  <label className="block text-sm font-medium text-accent">Categorie Achtergronden</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  >
                    <option value="">Alle categorieën</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[49%]">
                  <label className="block text-sm font-medium text-accent">Evenement Achtergrond</label>
                  <select
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  >
                    <option value="" disabled>Kies een achtergrond</option>
                    {filteredImages.map((img) => (
                      <option key={img.id} value={img.imageLink}>
                        {img.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent">Budget per persoon (€)</label>
                <input
                  type="number"
                  value={eventData.budget || ""}
                  onChange={(e) => setEventData({ ...eventData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  placeholder="Bijvoorbeeld 25"
                  min={0}
                  step={0.01}
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={eventData.isLootjesEvent}
                    onChange={(e) => setEventData({ ...eventData, isLootjesEvent: e.target.checked })}
                    className="h-4 w-4 text-warm-olive focus:ring-warm-olive border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-accent">Dit is een lootjes evenement</span>
                </label>

                {eventData.isLootjesEvent && (
                  <input
                    type="date"
                    value={eventData.registrationDeadline}
                    onChange={(e) => setEventData({ ...eventData, registrationDeadline: e.target.value })}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                    max={eventData.date}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={eventData.participantType === "manual"}
                    onChange={() => setEventData({ ...eventData, participantType: "manual" })}
                    className="h-4 w-4 text-warm-olive focus:ring-warm-olive border-gray-300"
                  />
                  <span className="text-sm text-accent">Ik voeg de deelnemers manueel toe</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={eventData.participantType === "self-register"}
                    onChange={() => setEventData({ ...eventData, participantType: "self-register" })}
                    className="h-4 w-4 text-warm-olive focus:ring-warm-olive border-gray-300"
                  />
                  <span className="text-sm text-accent">Deelnemers registreren zichzelf met een link</span>
                </label>
              </div>

              {eventData.participantType === "self-register" && (
                <input
                  type="number"
                  value={eventData.maxParticipants || ""}
                  onChange={(e) =>
                    setEventData({ ...eventData, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                  min={1}
                  placeholder="Maximum deelnemers"
                />
              )}

              <button type="submit" className="w-full bg-warm-olive text-white px-4 py-2 rounded-md hover:bg-cool-olive">
                Volgende
              </button>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {eventData.participantType === "manual" &&
                eventData.participants.map((participant, idx) => (
                  <div key={participant.id} className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={participant.firstName}
                      onChange={(e) => {
                        const updated = [...eventData.participants];
                        updated[idx].firstName = e.target.value;
                        setEventData({ ...eventData, participants: updated });
                      }}
                      placeholder="Voornaam"
                      className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                      required
                    />
                    <input
                      type="text"
                      value={participant.lastName}
                      onChange={(e) => {
                        const updated = [...eventData.participants];
                        updated[idx].lastName = e.target.value;
                        setEventData({ ...eventData, participants: updated });
                      }}
                      placeholder="Achternaam"
                      className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (participant.id === (isMainProfile ? currentUser?.id : profileData?.id)) return;
                        setEventData({
                          ...eventData,
                          participants: eventData.participants.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-[#b34c4c] hover:text-red-800"
                      disabled={participant.id === (isMainProfile ? currentUser?.id : profileData?.id)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => {
                  const newId = crypto.randomUUID();
                  const organizerId = isMainProfile ? currentUser?.id : profileData?.id;
                  const newParticipants = [
                    ...eventData.participants,
                    { id: newId, firstName: "", lastName: "", confirmed: false },
                  ];
                  const organizer = newParticipants.find((p) => p.id === organizerId);
                  const others = newParticipants.filter((p) => p.id !== organizerId);
                  setEventData({ ...eventData, participants: [organizer, ...others] });
                }}
                className="w-full border border-gray-300 text-accent px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Deelnemers Toevoegen
              </button>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-md border border-gray-300 text-accent hover:bg-gray-50">
                  Ga Terug
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-warm-olive text-white hover:bg-cool-olive">
                  Maak Evenement Aan
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
