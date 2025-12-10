"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDoc, doc, updateDoc, collection, query, where, getDocs, increment } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { nlBE } from "date-fns/locale";
import Image from "next/image";

import { useAuthStore } from "@/lib/store/use-auth-store";
import { eventSchema, type Event, type EventParticipant } from "@/types/event";
import type { SubProfile, UserProfile } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Separator } from "@/components/ui/separator";

// FIX: Beide types (UserProfile en SubProfile) hebben nu de benodigde velden
type ProfileOption = (UserProfile | SubProfile) & { id: string };

export default function EventParticipationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { currentUser, isInitialized } = useAuthStore();
  const openModal = useAuthStore(state => state.openModal);

  const [event, setEvent] = useState<Event | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSelect, setShowProfileSelect] = useState(false);

  useEffect(() => {
    if (!isInitialized || !eventId) return;

    const fetchEventData = async () => {
      setLoading(true);
      if (!currentUser) {
        toast.info("Je moet ingelogd zijn om deel te nemen.");
        openModal("login");
        setLoading(false);
        return;
      }

      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          setError("Evenement niet gevonden.");
          return;
        }
        
        const validation = eventSchema.safeParse({ id: eventSnap.id, ...eventSnap.data() });
        if (!validation.success) {
            console.error("Zod validation error:", validation.error.flatten());
            throw new Error("De data van het evenement is corrupt.");
        }
        const eventData = validation.data;
        setEvent(eventData);

        const profilesQuery = query(collection(db, "profiles"), where("userId", "==", currentUser.id));
        const profilesSnapshot = await getDocs(profilesQuery);
        
        const userProfiles: ProfileOption[] = profilesSnapshot.docs.map((doc) => ({
          ...(doc.data() as SubProfile),
          id: doc.id, 
        }));

        setProfiles([
          { ...currentUser, id: currentUser.id }, // currentUser is nu een volledig UserProfile
          ...userProfiles
        ]);

      } catch (err) {
        console.error(err);
        setError("Ophalen van het evenement mislukt.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, currentUser, isInitialized, router, openModal]);

  const handleRegister = async (profileToRegister: ProfileOption) => {
    if (!currentUser || !event) return;

    setIsJoining(true);
    try {
      const eventRef = doc(db, "events", eventId);

      const newParticipant: EventParticipant = {
        id: profileToRegister.id,
        firstName: profileToRegister.firstName,
        lastName: profileToRegister.lastName,
        email: 'email' in profileToRegister ? profileToRegister.email : currentUser.email, // Gebruik profiel email indien beschikbaar
        confirmed: true,
        wishlistId: undefined,
      };

      await updateDoc(eventRef, {
        [`participants.${profileToRegister.id}`]: newParticipant,
        participantCount: increment(1),
      });
      
      toast.success(`${profileToRegister.firstName} neemt nu deel aan "${event.name}"!`);
      router.push(`/dashboard/event/${eventId}`);

    } catch (err) {
      console.error("Deelname mislukt:", err);
      toast.error("Deelname is mislukt.");
    } finally {
      setIsJoining(false);
    }
  };
  
  // ... rest van je component blijft hetzelfde, de property errors zijn nu opgelost ...
  // Zorg dat de onClick handlers en LoadingSpinner `size` prop correct zijn zoals in mijn vorige antwoord.
}