/**
 * src/app/event/[id]/participate/page.tsx
 * FINALE VERSIE MET CORRECTE TYPES EN LOGICA
 */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { Event } from "@/types/event";
import { UserProfile } from "@/types/user";
import { HashLoader } from "react-spinners";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SubProfile {
  id: string;
  name: string;
}

export default function EventParticipationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // We halen nu alles uit de geünificeerde auth store.
  const { currentUser, isInitialized, setAuthModalState } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [profiles, setProfiles] = useState<SubProfile[]>([]);

  // Functie om de login modal te tonen, nu via de auth store
  const showLoginModal = (onSuccess?: () => void) => {
    setAuthModalState({ open: true, view: 'login' });
    // Callback functionaliteit kan je hier verder uitbouwen indien nodig
  };

  useEffect(() => {
    if (!isInitialized) return;

    const fetchEvent = async () => {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, "events", id));
        if (!eventDoc.exists()) {
          toast.error("Evenement niet gevonden.");
          router.push("/404");
          return;
        }
        const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
        setEvent(eventData);

        if (currentUser) {
          const isParticipant = Object.values(eventData.participants).some(p => p.id === currentUser.id && p.confirmed);
          if (isParticipant) {
             toast.info("Je neemt al deel aan dit evenement.");
             router.push(`/dashboard/event/${id}`);
             return;
          }

          const profilesQuery = query(collection(db, "users", currentUser.id, "profiles"));
          const profilesSnapshot = await getDocs(profilesQuery);
          const userProfiles = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubProfile[];
          setProfiles(userProfiles);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        toast.error("Ophalen van evenement is mislukt.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, router, currentUser, isInitialized]);

  const handleConfirmClick = () => {
    if (!selectedParticipantId) {
      toast.info("Selecteer eerst je naam uit de lijst.");
      return;
    }
    if (!currentUser) {
      toast.info("Je moet ingelogd zijn om deel te nemen.");
      showLoginModal(() => {
        toast.success("Je bent ingelogd! Probeer nu opnieuw deel te nemen.");
      });
      return;
    }
    
    if (profiles.length > 0) {
      setShowProfileSelect(true);
    } else {
      handleJoinEvent(currentUser.id);
    }
  };

  const handleJoinEvent = async (profileIdToJoinWith: string) => {
    if (!event || !selectedParticipantId || !currentUser) return;

    setLoading(true);
    try {
      const participantToUpdate = event.participants[selectedParticipantId];

      if (!participantToUpdate || participantToUpdate.confirmed) {
        toast.warning("Deze plek is al ingenomen of ongeldig.");
        setLoading(false);
        return;
      }
      
      const updatedDrawnNames = { ...event.drawnNames };
      for (const key in updatedDrawnNames) {
        if (updatedDrawnNames[key] === selectedParticipantId) {
          // CORRECTIE: Typfout hersteld
          updatedDrawnNames[key] = profileIdToJoinWith;
        }
      }

      const updatedParticipant = {
        ...participantToUpdate,
        id: profileIdToJoinWith,
        email: currentUser.email,
        confirmed: true,
      };

      await updateDoc(doc(db, "events", id), {
        [`participants.${selectedParticipantId}`]: updatedParticipant,
        drawnNames: updatedDrawnNames,
      });

      toast.success(`Welkom op ${event.name}, ${participantToUpdate.firstName}!`);
      router.push(`/dashboard/event/${id}`);

    } catch (err) {
      console.error("Error joining event:", err);
      toast.error("Deelnemen aan het evenement is mislukt.");
    } finally {
      setLoading(false);
    }
  };
  
  // De rest van je component (de JSX) was al perfect en hoeft niet te veranderen!
  // ... plak hier de JSX van je vorige poging ...
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="#4d7c0f" size={40} />
      </div>
    );
  }

  if (!event) {
     return <div className="flex h-screen items-center justify-center"><p>Evenement wordt geladen...</p></div>;
  }
  
  if (showProfileSelect && currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Met welk profiel neem je deel?</h2>
          <div className="space-y-4">
            <Button variant="outline" onClick={() => handleJoinEvent(currentUser.id)} className="w-full justify-start p-6 text-lg">
              {currentUser.firstName} {currentUser.lastName} (Jij)
            </Button>
            {profiles.map(profile => (
              <Button variant="outline" key={profile.id} onClick={() => handleJoinEvent(profile.id)} className="w-full justify-start p-6 text-lg">
                {profile.name}
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setShowProfileSelect(false)} className="mt-6 w-full text-gray-600">
            Terug
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen items-center gap-6 bg-gray-50 p-6 md:grid-cols-2">
      <div className="flex items-center justify-center">
        <img src="/welcome.svg" alt="Deelnemen aan evenement" className="w-full max-w-md rounded-lg" />
      </div>
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <h1 className="text-3xl font-bold text-gray-800">Je bent uitgenodigd!</h1>
        <h2 className="mb-4 text-2xl font-semibold text-lime-700">{event.name}</h2>
        <p className="mb-6 text-gray-600">Selecteer jouw naam uit de lijst om je deelname te bevestigen.</p>
        <div className="w-full max-w-sm">
          <label htmlFor="name-select" className="mb-2 block text-sm font-medium text-gray-700">Selecteer je naam:</label>
          <select
            id="name-select"
            className="block w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-lime-500 focus:ring-lime-500"
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
          >
            <option value="" disabled>-- Kies je naam --</option>
            {Object.entries(event.participants)
              .filter(([_, p]) => !p.confirmed)
              .map(([key, p]) => (
                <option key={key} value={key}>
                  {p.firstName} {p.lastName}
                </option>
            ))}
          </select>
          <Button onClick={handleConfirmClick} className="mt-4 w-full" size="lg" disabled={loading}>
            {loading ? "Moment..." : "Bevestig mijn deelname"}
          </Button>
        </div>
      </div>
    </div>
  );
}