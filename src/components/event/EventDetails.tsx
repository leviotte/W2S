import { useState, useCallback, memo } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Info,
  Phone,
  Mail,
  Edit2,
  Share2,
} from "lucide-react";
import CountdownTimer from "../CountdownTimer";
import EventDetailsForm from "./EventDetailsForm";
import { EventDetailsData } from "./EventDetailsForm";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useStore } from "@/src/lib/store/useStore";

interface EventDetailsProps {
  name: string;
  date: string;
  time?: string;
  endTime?: string;
  budget: number;
  location?: string;
  theme?: string;
  additionalInfo?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  isOrganizer: boolean;
  backgroundImage: string;
  onUpdate: (data: Partial<EventDetailsData>) => Promise<void>;
  selfRegisteration: any;
  id: any;
  isEditing: any;
  setIsEditing: any;
  allowDrawingNames: boolean;
  drawingModalToggle: any;
  setDrawingModalToggle: any;
  participants: any;
  isDrawingNames: boolean;
}

/* -------------------------------
   Reusable modal for performance
--------------------------------- */
const ConfirmationModal = memo(function ConfirmationModal({
  onCancel,
  onConfirm,
  isLoading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Are you sure you want to start drawing?
        </h2>
        <p className="text-sm text-gray-700 mb-4">
          Once drawing starts, no more participants can join. This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#b34c4c] text-white hover:bg-[#b34c4c] disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Starting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------- */

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function EventDetails({
  name,
  date,
  time,
  endTime,
  location,
  theme,
  additionalInfo,
  organizerPhone,
  organizerEmail,
  isOrganizer,
  backgroundImage,
  onUpdate,
  selfRegisteration,
  id,
  isEditing,
  setIsEditing,
  allowDrawingNames,
  drawingModalToggle,
  setDrawingModalToggle,
  participants,
  isDrawingNames,
}: EventDetailsProps) {
  const { updateEvent } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyToClipboard = useCallback(async () => {
    const base = window.location.origin;
    const link = selfRegisteration
      ? `${base}/event/self-register/${id}`
      : `${base}/event/participation/${id}`;

    await navigator.clipboard.writeText(link);
    toast.success("Link gekopieerd naar het klembord!");

    if (id) updateEvent(id, { isInvited: true });
  }, [id, selfRegisteration, updateEvent]);

  const handleSave = useCallback(
    async (data: EventDetailsData) => {
      try {
        await onUpdate(data);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating event details:", error);
      }
    },
    [onUpdate, setIsEditing]
  );

  const handleStartDrawing = useCallback(async () => {
    try {
      setIsLoading(true);
      await updateEvent(id, {
        allowDrawingNames: true,
        maxParticipants: participants?.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setDrawingModalToggle(false);
    }
  }, [id, participants, updateEvent, setDrawingModalToggle]);

  /* ------------------------------------------
     EDIT MODE — no rendering of rest of page
  ------------------------------------------- */
  if (isEditing) {
    return (
      <div
        className="backdrop-blur-sm bg-white/40 rounded-xl p-5 shadow-lg"
      >
        <EventDetailsForm
          initialData={{
            name,
            date,
            time,
            endTime,
            location,
            theme,
            additionalInfo,
            organizerPhone,
            organizerEmail,
            backgroundImage,
          }}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  /* ------------------------------------------
     MAIN OUTPUT
  ------------------------------------------- */
  return (
    <>
      {drawingModalToggle && (
        <ConfirmationModal
          onCancel={() => setDrawingModalToggle(false)}
          onConfirm={handleStartDrawing}
          isLoading={isLoading}
        />
      )}

      <div className="rounded-xl p-5 backdrop-blur-md bg-white/20 shadow-lg">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold text-gray-900">{name}</h1>

          <div className="flex items-center gap-2">
            {isOrganizer && (
              <button
                title="Share event"
                onClick={handleCopyToClipboard}
                className="hover:text-gray-600"
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}

            {isOrganizer && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:text-gray-600 transition-colors"
                title="Edit event"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}

            {isOrganizer && selfRegisteration && isDrawingNames && (
              <button
                disabled={isLoading || allowDrawingNames}
                onClick={() => setDrawingModalToggle(true)}
                className="max-w-[200px] disabled:cursor-not-allowed disabled:bg-gray-400 px-[15px] hover:bg-cool-olive transition-colors w-full h-[40px] rounded-[10px] bg-warm-olive text-white"
              >
                Start Drawing
              </button>
            )}
          </div>
        </div>

        <div className="mt-1">
          <CountdownTimer targetDate={date} targetTime={time} />
        </div>

        {/* DATE / TIME */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              {dateFormatter.format(new Date(date))}
              {time && (
                <>
                  <span className="mx-1">from</span>
                  {time}
                  {endTime && (
                    <>
                      <span className="mx-1">to</span>
                      {endTime}
                    </>
                  )}
                </>
              )}
            </span>
          </div>

          {location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{location}</span>
            </div>
          )}

          {theme && (
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{theme}</span>
            </div>
          )}

          {additionalInfo && (
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{additionalInfo}</span>
            </div>
          )}

          {organizerPhone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{organizerPhone}</span>
            </div>
          )}

          {organizerEmail && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{organizerEmail}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
