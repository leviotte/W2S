"use client";

import { useState, useCallback, memo } from "react";
import { Calendar, MapPin, Edit2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { nlBE } from 'date-fns/locale';

// --- Types ---
import type { Event, EventParticipant } from "@/types/event";

// --- Components ---
import CountdownTimer from "@/components/ui/countdown-timer";
import EventDetailsForm from "./EventDetailsForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// --- Props Definitie ---
interface EventDetailsProps {
  event: Event;
  participants: EventParticipant[];
  isOrganizer: boolean;
  updateEvent: (data: Partial<Event>) => void;
}

// ✅ FIX: isOpen in plaats van open
const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weet je het zeker?</DialogTitle>
          <DialogDescription>
            Zodra het trekken van namen begint, kunnen er geen deelnemers meer bij. Deze actie kan niet ongedaan gemaakt worden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuleren</Button>
          <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
            {isLoading ? "Starten..." : "Bevestig & Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
ConfirmationModal.displayName = "ConfirmationModal";

export default function EventDetails({ event, isOrganizer, updateEvent }: EventDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCopyToClipboard = useCallback(async () => {
    const base = window.location.origin;
    const link = event.allowSelfRegistration
      ? `${base}/event/self-register/${event.id}`
      : `${base}/event/participation/${event.id}`;

    await navigator.clipboard.writeText(link);
    toast.success("Link gekopieerd naar het klembord!");

    if (event.id) updateEvent({ isInvited: true });
  }, [event.id, event.allowSelfRegistration, updateEvent]);

  const handleSave = useCallback(
    async (data: Partial<Event>) => {
      try {
        await updateEvent(data);
        setIsEditing(false);
        toast.success("Evenementdetails bijgewerkt!");
      } catch (error) {
        console.error("Error updating event details:", error);
        toast.error("Kon de details niet bijwerken.");
      }
    },
    [updateEvent]
  );

  const handleStartDrawing = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateEvent({ allowDrawingNames: true });
      toast.success("Namen trekken is geactiveerd!");
    } catch (error) {
      console.error(error);
      toast.error("Kon het namen trekken niet starten.");
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  }, [updateEvent]);

  if (isEditing) {
    return (
      <Card className="backdrop-blur-sm bg-white/40 shadow-lg">
        <CardContent className="p-5">
          <EventDetailsForm
            initialData={event}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* ✅ FIX: isOpen prop */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleStartDrawing}
        isLoading={isLoading}
      />

      <Card className="rounded-xl p-5 backdrop-blur-md bg-white/20 shadow-lg">
        <CardHeader className="p-0 mb-2 flex-row items-start justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">{event.name}</CardTitle>
          <div className="flex items-center gap-2">
            {isOrganizer && (
              <Button title="Deel evenement" onClick={handleCopyToClipboard} variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            {isOrganizer && (
              <Button title="Bewerk evenement" onClick={() => setIsEditing(true)} variant="ghost" size="icon">
                <Edit2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {event.date && <CountdownTimer targetDate={event.date} />}
          
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">
                {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: nlBE })} om {event.time}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{event.location}</span>
              </div>
            )}
          </div>

          {isOrganizer && event.allowSelfRegistration && event.isLootjesEvent && (
            <div className="mt-4">
              <Button
                disabled={isLoading || event.allowDrawingNames}
                onClick={() => setShowConfirmation(true)}
                className="w-full"
              >
                {event.allowDrawingNames ? "Namen trekken is actief" : "Start Namen Trekken"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}