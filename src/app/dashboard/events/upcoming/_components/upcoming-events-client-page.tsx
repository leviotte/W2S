// src/app/dashboard/events/upcoming/_components/upcoming-events-client-page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteEventAction } from "@/lib/server/actions/events";
import type { Event } from "@/types/event";
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ArrowRight } from "lucide-react";

interface UpcomingEventsClientPageProps {
  initialEvents: Event[];
  userId: string;
}

export default function UpcomingEventsClientPage({ initialEvents, userId }: UpcomingEventsClientPageProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("nl-BE", { dateStyle: "long" }).format(date);
};


  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(eventId);

    const result = await deleteEventAction(eventId);

    if (result.success) {
      toast.success("Evenement succesvol verwijderd!");
      router.refresh();
    } else {
      toast.error(result.message || "Kon het evenement niet verwijderen.");
    }

    setIsDeleting(null);
  };

  const handleCardClick = (eventId: string) => {
    router.push(`/dashboard/event/${eventId}`);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {initialEvents.map((event) => {
        // fix: gebruik fallback voor organizerId
        const isOrganizer = event.organizerId ? event.organizerId === userId : event.organizer === userId;

        return (
          <Card
            key={event.id}
            className="group relative flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => handleCardClick(event.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{event.name}</span>
              </CardTitle>
              <CardDescription>
  📅 {formatDate(event.startDateTime)}
</CardDescription>
            </CardHeader>

            {event.budget && event.budget > 0 && (
              <CardContent>💰 Budget: €{event.budget}</CardContent>
            )}

            <CardFooter className="flex justify-between items-center border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                <span>Bekijk details</span>
                <ArrowRight className="h-4 w-4" />
              </div>

              {isOrganizer && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isDeleting === event.id}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isDeleting === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deze actie kan niet ongedaan gemaakt worden. Het evenement <strong>{event.name}</strong> wordt permanent verwijderd.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => handleDelete(event.id, e)} className="bg-destructive hover:bg-destructive/80">
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
