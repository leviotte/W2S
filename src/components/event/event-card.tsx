// src/components/event/event-card.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import type { Event } from '@/types/event';
import CountdownTimer from '../ui/countdown-timer';

interface EventCardProps {
  event: Event;
  currentUserId: string;
  onDelete: (eventId: string, eventName: string) => void;
}

export default function EventCard({ event, currentUserId, onDelete }: EventCardProps) {
  const router = useRouter();
  const isOrganizer = event.organizerId === currentUserId;

  const handleCardClick = () => {
    router.push(`/dashboard/event/${event.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Voorkom dat de kaart-klik wordt getriggerd
    onDelete(event.id, event.name);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
    >
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            {new Date(event.date).toLocaleDateString('nl-BE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardDescription>
        </div>
        {isOrganizer && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600 focus:text-red-700">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Verwijder
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Je staat op het punt het evenement &quot;{event.name}&quot; te verwijderen. Deze actie kan niet ongedaan gemaakt worden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteClick}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ja, verwijder evenement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        {event.budget && <p className="text-sm text-muted-foreground mb-2">Budget: €{event.budget}</p>}
        {event.date && <CountdownTimer targetDate={event.date} />}
        {/* Hier kunnen we later de 'todo' logica weer toevoegen als een apart component */}
      </CardContent>
    </Card>
  );
}