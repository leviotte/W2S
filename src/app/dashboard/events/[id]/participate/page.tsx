// src/app/dashboard/event/[id]/participate/page.tsx

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
import type { UserProfile, SubProfile } from "@/types/user";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Separator } from "@/components/ui/separator";

type ProfileOption = (UserProfile | SubProfile) & { id: string };

export default function EventParticipationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { currentUser, isInitialized, openModal } = useAuthStore();

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

        const isAlreadyParticipant = Object.keys(eventData.participants || {}).some(
          (pId) => pId === currentUser.id
        );
        if (isAlreadyParticipant) {
          toast.info(`Je neemt al deel aan "${eventData.name}".`);
          router.push(`/dashboard/event/${eventId}`);
          return;
        }

        const profilesQuery = query(collection(db, "profiles"), where("userId", "==", currentUser.id));
        const profilesSnapshot = await getDocs(profilesQuery);
        
        const userProfiles: SubProfile[] = profilesSnapshot.docs.map((doc) => ({
          ...(doc.data() as Omit<SubProfile, 'id'>),
          id: doc.id, 
        }));

        setProfiles([
          { ...currentUser, id: currentUser.id },
          ...userProfiles
        ]);

      } catch (err) {
        console.error(err);
        setError("Ophalen van het evenement mislukt.");
        toast.error("Ophalen van het evenement mislukt.");
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
        email: 'email' in profileToRegister ? profileToRegister.email : currentUser.email,
        confirmed: true,
        wishlistId: undefined,
        photoURL: profileToRegister.photoURL || null,
      };

      await updateDoc(eventRef, {
        [`participants.${profileToRegister.id}`]: newParticipant,
        participantCount: increment(1),
      });
      
      toast.success(`${profileToRegister.firstName} neemt nu deel aan "${event.name}"!`);
      router.push(`/dashboard/event/${eventId}`);

    } catch (err) {
      console.error("Deelname mislukt:", err);
      toast.error("Deelname is mislukt. Probeer het opnieuw.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner text="Evenement wordt geladen..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Fout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
              Terug naar Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Deelnemen aan: {event.name}</CardTitle>
          <CardDescription>
            Georganiseerd door {event.organizerName} op {format(event.date, "d MMMM yyyy", { locale: nlBE })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.imageUrl && (
            <div className="relative h-48 w-full overflow-hidden rounded-md">
              <Image 
                src={event.imageUrl} 
                alt={event.name} 
                fill
                className="object-cover"
              />
            </div>
          )}
          {event.description && <p>{event.description}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!showProfileSelect ? (
            <Button 
              onClick={() => setShowProfileSelect(true)} 
              disabled={isJoining} 
              className="w-full"
            >
              Nu Deelnemen
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <Separator />
              <h3 className="text-center font-semibold">Wie neemt er deel?</h3>
              <div className="flex flex-col gap-3">
                {profiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    onClick={() => handleRegister(profile)}
                    disabled={isJoining}
                    className="flex h-auto items-center justify-start gap-4 p-4"
                  >
                    <UserAvatar 
                      photoURL={profile.photoURL}
                      firstName={profile.firstName}
                      lastName={profile.lastName}
                      size="md"
                    />
                    <span className="font-medium">{profile.firstName} {profile.lastName}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}