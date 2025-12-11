"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteEventAction } from "@/app/dashboard/event/[id]/actions";
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
import { Trash2, Loader2, ArrowRight } from "lucide-react";

interface PastEventsClientPageProps {
  initialEvents: Event[];
  currentUserId: string;
}

export function PastEventsClientPage({ 
  initialEvents, 
  currentUserId 
}: PastEventsClientPageProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("nl-BE", { dateStyle: "long" }).format(date);
  };

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    setIsDeleting(eventId);
    
    const result = await deleteEventAction(eventId);
    
    if (result.success) {
      toast.success("Evenement succesvol verwijderd!");
      router.refresh(); // Revalidate server data
    } else {
      toast.error(result.message || "Kon het evenement niet verwijderen.");
    }
    
    setIsDeleting(null);
  };

  const handleCardClick = (eventId: string) => {
    router.push(`/dashboard/event/${eventId}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Afgelopen Evenementen</h1>
        <p className="text-sm text-muted-foreground">
          {initialEvents.length} {initialEvents.length === 1 ? 'evenement' : 'evenementen'}
        </p>
      </div>

      {initialEvents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialEvents.map((event) => {
            const isOrganizer = event.organizerId === currentUserId || event.organizer === currentUserId;

            return (
              <Card
                key={event.id}
                className="group relative flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-pointer"
                onClick={() => handleCardClick(event.id)}
              >
                <div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{event.name}</span>
                      {event.isLootjesEvent && (
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          Lootjes
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-2">
                        📅 {formatDate(event.date)}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  {event.budget && event.budget > 0 && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        💰 Budget: €{event.budget}
                      </p>
                    </CardContent>
                  )}
                </div>

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
                          {isDeleting === event.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                            Annuleren
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDelete(event.id, e)}
                            className="bg-destructive hover:bg-destructive/80"
                          >
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-3">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold">Geen afgelopen evenementen</h3>
            <p className="text-muted-foreground max-w-md">
              Evenementen die verlopen zijn, verschijnen hier automatisch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}