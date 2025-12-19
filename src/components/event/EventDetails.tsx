// src/components/event/EventDetails.tsx
"use client";

import { useState, useCallback, memo } from "react";
import { Calendar, MapPin, Edit2, Share2, Clock, Info, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';

// --- Types ---
import type { Event, EventParticipant } from "@/types/event";

// --- Components ---
import CountdownTimer from "@/components/shared/countdown-timer";
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

// ✅ Confirmation Modal
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

export default function EventDetails({ event, isOrganizer, updateEvent, participants }: EventDetailsProps) {
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
      await updateEvent({ 
        allowDrawingNames: true,
        maxParticipants: participants.length 
      });
      toast.success("Namen trekken is geactiveerd!");
    } catch (error) {
      console.error(error);
      toast.error("Kon het namen trekken niet starten.");
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  }, [updateEvent, participants]);

  // ✅ Format date exactly like production
  const formatEventDate = () => {
    if (!event.date) return "";
    
    const dateStr = new Date(event.date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let timeStr = "";
    if (event.time) {
      timeStr = ` from ${event.time}`;
      if (event.endTime) {
        timeStr += ` to ${event.endTime}`;
      }
    }

    return dateStr + timeStr;
  };

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
      {/* ✅ Confirmation Modal */}
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
            {/* ✅ Start Drawing Button (zoals productie) */}
            {isOrganizer && event.allowSelfRegistration && event.isLootjesEvent && (
              <Button
                disabled={isLoading || event.allowDrawingNames}
                onClick={() => setShowConfirmation(true)}
                className="bg-warm-olive hover:bg-cool-olive text-white disabled:bg-gray-400"
              >
                {event.allowDrawingNames ? "Namen trekken is actief" : "Start Drawing"}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {event.date && <CountdownTimer targetDate={event.date} targetTime={event.time ?? undefined} />}
          
          <div className="mt-3 space-y-1.5">
            {/* ✅ Date + Time (EXACT zoals productie) */}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{formatEventDate()}</span>
            </div>

            {/* ✅ Location */}
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-warm-olive"
                  >
                    {event.location}
                  </a>
                </span>
              </div>
            )}

            {/* ✅ Theme (NIEUW!) */}
            {event.theme && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{event.theme}</span>
              </div>
            )}

            {/* ✅ Additional Info */}
            {event.additionalInfo && (
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap text-sm">{event.additionalInfo}</p>
              </div>
            )}

            {/* ✅ ORGANIZER CONTACT DETAILS (NIEUW! - Exact zoals productie) */}
            {(event.organizerPhone || event.organizerEmail) && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 mb-1">
                  Organizer contact details:
                </h3>
                <div className="space-y-1">
                  {event.organizerPhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-gray-600" />
                      <span className="text-sm">
                        <a
                          href={`tel:${event.organizerPhone}`}
                          className="text-gray-600 hover:text-warm-olive"
                        >
                          {event.organizerPhone}
                        </a>
                      </span>
                    </div>
                  )}
                  {event.organizerEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-gray-600" />
                      <span className="text-sm">
                        <a
                          href={`mailto:${event.organizerEmail}`}
                          className="text-gray-600 hover:text-warm-olive"
                        >
                          {event.organizerEmail}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}