"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/use-auth-store";
import type { Event } from "@/types/event";
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
import { Trash2, Loader2 } from "lucide-react";

interface PastEventsClientPageProps {
  initialEvents: Event[];
}

export function PastEventsClientPage({ initialEvents }: PastEventsClientPageProps) {
  const router = useRouter();
  const { deleteEvent, currentUser } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("nl-BE", { dateStyle: "long" }).format(date);
  };

  const handleDelete = async (eventId: string) => {
    setIsDeleting(eventId);
    const result = await deleteEvent(eventId);
    
    if (result.success) {
      toast.success("Evenement succesvol verwijderd!");
      // De server action heeft revalidatePath() al aangeroepen.
      // Een router.refresh() zorgt ervoor dat de UI de nieuwe data toont.
      router.refresh();
    } else {
      toast.error(result.error || "Kon het evenement niet verwijderen.");
    }
    setIsDeleting(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-foreground mb-4">Afgelopen Evenementen</h1>
      {initialEvents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {initialEvents.map((event) => (
            <Card
              key={event.id}
              className="flex flex-col justify-between transition-shadow duration-200 hover:shadow-lg"
            >
              <div onClick={() => router.push(`/dashboard/event/${event.id}`)} className="cursor-pointer">
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>Datum: {formatDate(event.date)}</CardDescription>
                </CardHeader>
                {event.budget && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Budget: €{event.budget}</p>
                  </CardContent>
                )}
              </div>
              <CardFooter className="flex justify-end">
                {currentUser?.id === event.organizerId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} disabled={isDeleting === event.id}>
                        {isDeleting === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deze actie is onomkeerbaar en verwijdert het evenement permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive hover:bg-destructive/80">
                          Verwijderen
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
        <p className="text-muted-foreground">Geen afgelopen evenementen gevonden.</p>
      )}
    </div>
  );
}