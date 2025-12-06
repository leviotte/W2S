"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/use-auth-store";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { AiOutlineArrowRight } from "react-icons/ai";

export default function PastEventsPage() {
  const router = useRouter();
  const { events, loadEvents, deleteEvent, currentUser } = useAuthStore();

  useEffect(() => {
    loadEvents().catch((err) => console.error("Error loading events:", err));
  }, [loadEvents]);

  const activeProfile = typeof window !== "undefined"
    ? localStorage.getItem("activeProfile")
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-GB").format(date);
  };

  const pastEvents = events.filter((event) => {
    if (!event.date) return false;
    return (
      event.profileId === activeProfile &&
      new Date(event.date).getTime() < Date.now()
    );
  });

  const handleClick = (id: string) => {
    router.push(`/dashboard/event/${id}?tab=events&subTab=details`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-accent my-2">
        Afgelopen evenementen
      </h1>

      {pastEvents.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {pastEvents.map((event) => (
            <Card
              key={event.id}
              onClick={() => handleClick(event.id)}
              className="border-gray-200 shadow hover:shadow-lg bg-white transition-shadow duration-200 cursor-pointer"
            >
              <CardHeader>
                <CardTitle className="text-xl font-bold text-accent">
                  {event.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Datum: {formatDate(event.date)}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {event.budget ? (
                  <p className="text-gray-400">Budget: €{event.budget}</p>
                ) : null}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                {currentUser?.id === event.organizer && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-white rounded-3xl bg-gray-400 hover:bg-gray-700 border-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Verwijder
                      </Button>
                    </AlertDialogTrigger>

                    <div
                      className="flex justify-end items-center mt-4 w-full text-accent hover:text-green-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm font-medium">
                        Ga naar evenement
                      </span>
                      <AiOutlineArrowRight className="ml-2" />
                    </div>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ben je zeker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deze actie kan niet ongedaan worden en zal dit
                          evenement permanent verwijderen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-gray-100 hover:text-accent text-accent border-none">
                          Annuleer
                        </AlertDialogCancel>

                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600 text-white border-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                        >
                          Verwijder evenement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-accent">Geen afgelopen evenementen gevonden.</p>
      )}
    </div>
  );
}
