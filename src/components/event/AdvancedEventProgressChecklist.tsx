// src/components/event/AdvancedEventProgressChecklist.tsx
"use client";

import React, { useState, useMemo, FC } from "react";
import Link from "next/link";
import { Check, X, Circle, ChevronRight, UserPlus, Gift } from "lucide-react";
import type { Event, EventParticipant } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import { Button } from "@/components/ui/button";

interface AdvancedEventProgressChecklistProps {
  event: Event;
  participants: EventParticipant[];
  wishlists: Record<string, Wishlist>;
  currentUserId: string;
  isOrganizer: boolean;
}

const AdvancedEventProgressChecklist: FC<AdvancedEventProgressChecklistProps> = ({ event, participants, isOrganizer }) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const confirmedParticipants = useMemo(() => participants.filter(p => p.confirmed), [participants]);
  const drawnNamesCount = useMemo(() => Object.keys(event.drawnNames || {}).length, [event.drawnNames]);

  // GOLD STANDARD FIX:
  // Creëer de stappen in een array. Gebruik `map` en geef `null` terug voor
  // conditionele stappen die niet getoond moeten worden. Filter daarna de `null` waarden eruit.
  // Dit is type-veilig.
  const steps = useMemo(() => [
    {
      id: "participants",
      text: "Registratie deelnemers",
      icon: <UserPlus className="w-4 h-4" />,
      isCompleted: confirmedParticipants.length === participants.length && participants.length > 0,
      info: `${confirmedParticipants.length} van ${participants.length} deelnemers hebben bevestigd.`,
      actionText: "Beheer uitnodigingen",
      actionPath: `/dashboard/event/${event.id}/invites`,
    },
    event.isLootjesEvent ? { // Conditionele stap
      id: "drawname",
      text: "Namen trekken",
      icon: <Gift className="w-4 h-4" />,
      isCompleted: drawnNamesCount === participants.length && participants.length > 0,
      info: `${drawnNamesCount} van ${participants.length} deelnemers hebben een naam getrokken.`,
      actionText: "Status bekijken",
      actionPath: `/dashboard/event/${event.id}/drawing-status`,
    } : null,
    // ... voeg hier andere stappen toe op dezelfde manier
  ].filter((step): step is Exclude<typeof step, null> => step !== null), [event, participants, confirmedParticipants.length, drawnNamesCount]);

  return (
    <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Evenement Voortgang</h3>
      <ul className="space-y-2">
        {steps.map((step, index) => {
          const isActive = !step.isCompleted && (index === 0 || (steps[index - 1]?.isCompleted));
          const status = step.isCompleted ? 'completed' : isActive ? 'active' : 'inactive';

          const visuals = {
            completed: { bgColor: "bg-green-500", icon: <Check className="text-white w-4 h-4" /> },
            active: { bgColor: "bg-blue-500", icon: <Circle className="text-white w-4 h-4" fill="currentColor" /> },
            inactive: { bgColor: "bg-gray-300", icon: <X className="text-white w-4 h-4" /> },
          };

          return (
            <li key={step.id} className="p-2 rounded-md hover:bg-white/50 cursor-pointer" onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${visuals[status].bgColor}`}>
                  {visuals[status].icon}
                </div>
                <div className="flex-1 ml-3">
                  <span className="font-medium text-gray-800">{step.text}</span>
                </div>
                <ChevronRight className={`transition-transform duration-200 ${activeStep === step.id ? "rotate-90" : ""}`} />
              </div>
              {activeStep === step.id && (
                <div className="pl-11 mt-2">
                  <p className="text-sm text-gray-600">{step.info}</p>
                  {isOrganizer && <Link href={step.actionPath} passHref>
                    <Button asChild variant="link" className="p-0 h-auto mt-1"><span className="text-sm">{step.actionText}</span></Button>
                  </Link>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdvancedEventProgressChecklist;