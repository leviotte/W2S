// src/components/event/AdvancedEventProgressChecklist.tsx
"use client";

import React, { useState, useMemo, FC } from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Circle, 
  ChevronRight, 
  UserPlus, 
  AlertCircle,
  ListChecks,
  Gift as GiftIcon,
  PartyPopper,
  XIcon
} from "lucide-react";
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

interface Step {
  id: string;
  text: string;
  icon: React.ReactNode;
  computeStatus: () => StepStatus;
  computeProgress: () => { current: number; total: number };
  info: string;
  actionText?: string;
  actionPath?: string;
  showActionForUser: boolean;
  onClick?: () => void;
  hoverText?: string;
}

type StepStatus = "completed" | "active" | "inactive";

interface ModalSection {
  title: string;
  items: string[];
}

interface ModalContent {
  title: string;
  data: ModalSection[];
}

const AdvancedEventProgressChecklist: FC<AdvancedEventProgressChecklistProps> = ({ 
  event, 
  participants, 
  wishlists,
  currentUserId,
  isOrganizer 
}) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "",
    data: [],
  });

  // ✅ COMPUTED VALUES
  const confirmedParticipants = useMemo(() => participants.filter(p => p.confirmed), [participants]);
  const unconfirmedParticipants = useMemo(() => participants.filter(p => !p.confirmed), [participants]);
  const drawnNames = event.drawnNames || {};
  const drawnNamesCount = useMemo(() => Object.keys(drawnNames).length, [drawnNames]);
  const participantsWithWishlist = useMemo(() => participants.filter(p => p.wishlistId), [participants]);
  
  const totalParticipants = event.allowSelfRegistration 
    ? event.maxParticipants 
    : participants.length;

  // ✅ Helper: Check if participant purchased for event
  const hasParticipantPurchasedForEvent = (
  participantId: string,
  eventId: string,
  wishlists: Record<string, Wishlist>
): boolean => {
  for (const wishlistId in wishlists) {
    const wishlist = wishlists[wishlistId];
    for (const item of wishlist.items || []) {
      if (
        item.multiPurchasedBy?.[eventId]?.includes(participantId)
        // || item.purchasedBy === participantId   // optionele fallback
      ) {
        return true;
      }
    }
  }
  return false;
};

  // ✅ Helper: Format names with limit
  const formatNamesWithLimit = (
    participants: EventParticipant[],
    limit = 3
  ): string => {
    if (participants.length === 0) return "";

    const displayParticipants = participants.slice(0, limit);
    const remainingCount = participants.length - limit;

    const formattedNames = displayParticipants
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(", ");

    if (remainingCount > 0) {
      return `${formattedNames} en ${remainingCount} ${
        remainingCount === 1 ? "andere" : "anderen"
      }`;
    }

    return formattedNames;
  };

  // ✅ Get hover text for each step
  const getHoverText = (stepId: string): string => {
    switch (stepId) {
      case "participants":
        return `${confirmedParticipants.length} van ${totalParticipants} deelnemers geregistreerd`;
      case "drawname":
        return `${drawnNamesCount} van ${totalParticipants} namen getrokken`;
      case "wishlist":
        return `${participantsWithWishlist.length} van ${totalParticipants} verlanglijstjes toegevoegd`;
      case "gift":
        const purchasedGifts = participants.filter((i) =>
          hasParticipantPurchasedForEvent(i.id, event.id, wishlists)
        );
        return `${purchasedGifts.length} van ${totalParticipants} cadeaus gekocht`;
      case "surprise":
        return event.eventComplete
          ? "Evenement afgerond!"
          : "goed gedaan! Laat het feest beginnen.";
      default:
        return "";
    }
  };

  // ✅ Get progress text (X/Y format)
  const getProgressText = (stepId: string): string => {
    switch (stepId) {
      case "participants":
        return `${confirmedParticipants.length}/${totalParticipants}`;
      case "drawname":
        return `${drawnNamesCount}/${totalParticipants}`;
      case "wishlist":
        return `${participantsWithWishlist.length}/${totalParticipants}`;
      case "gift":
        const purchasedGifts = participants.filter((i) =>
          hasParticipantPurchasedForEvent(i.id, event.id, wishlists)
        );
        return `${purchasedGifts.length}/${totalParticipants}`;
      default:
        return "";
    }
  };

  // ✅ Open modal with participant details
  const openModal = (stepId: string): void => {
    let title = "";
    let data: ModalSection[] = [];

    switch (stepId) {
      case "participants":
        title = "Deelnemers Registratie";
        data = [
          {
            title: "Geregistreerde deelnemers",
            items: confirmedParticipants.map(
              (p) => `${p.firstName} ${p.lastName}`
            ),
          },
          {
            title: "Niet-geregistreerde deelnemers",
            items: unconfirmedParticipants.map(
              (p) => `${p.firstName} ${p.lastName}`
            ),
          },
        ];
        break;
      case "drawname":
        title = "Namen Trekken";
        const withNames = participants.filter(
          (p) => drawnNames && p.id in drawnNames
        );
        const withoutNames = participants.filter(
          (p) => !drawnNames || !(p.id in drawnNames)
        );
        data = [
          {
            title: "Hebben een naam getrokken",
            items: withNames.map((p) => `${p.firstName} ${p.lastName}`),
          },
          {
            title: "Moeten nog een naam trekken",
            items: withoutNames.map((p) => `${p.firstName} ${p.lastName}`),
          },
        ];
        break;
      case "wishlist":
        title = "Verlanglijstjes";
        data = [
          {
            title: "Hebben een verlanglijstje toegevoegd",
            items: participantsWithWishlist.map(
              (p) => `${p.firstName} ${p.lastName}`
            ),
          },
          {
            title: "Moeten nog een verlanglijstje toevoegen",
            items: participants
              .filter((p) => !p.wishlistId)
              .map((p) => `${p.firstName} ${p.lastName}`),
          },
        ];
        break;
      case "gift":
        title = "Cadeau Aankopen";
        const participantsWhoPurchased = participants.filter((p) =>
          hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
        );
        const participantsWhoDontPurchased = participants.filter(
          (p) => !hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
        );
        data = [
          {
            title: "Hebben een cadeau gekocht",
            items: participantsWhoPurchased.map(
              (p) => `${p.firstName} ${p.lastName}`
            ),
          },
          {
            title: "Moeten nog een cadeau kopen",
            items: participantsWhoDontPurchased.map(
              (p) => `${p.firstName} ${p.lastName}`
            ),
          },
        ];
        break;
      case "surprise":
        title = "Evenement Afronding";
        data = [
          {
            title: "Evenement Details",
            items: [
              `Naam: ${event.name}`,
              `Datum: ${event.date}`,
              `Tijd: ${event.time}`,
              `Budget: €${event.budget}`,
              `Totaal aantal deelnemers: ${participants.length}`,
            ],
          },
        ];
        break;
      default:
        break;
    }

    setModalContent({ title, data });
    setShowModal(true);
  };

  // ✅ Determine step status with complex logic
  const determineStepStatus = (step: Step, index: number, allSteps: Step[]): StepStatus => {
    // First step
    if (index === 0) {
      if (event.isInvited && participants.every((p) => p.confirmed)) {
        return "completed";
      }
      return "active";
    }

    // Last step (surprise)
    if (index === allSteps.length - 1) {
      if (event.eventComplete) {
        return "completed";
      }

      const allPreviousStepsCompleted = allSteps
        .slice(0, index)
        .every(
          (prevStep) =>
            determineStepStatus(prevStep, allSteps.indexOf(prevStep), allSteps) === "completed"
        );

      if (allPreviousStepsCompleted) {
        return "completed";
      }
    }

    // Check if step is completed
    if (step.computeStatus() === "completed") {
      return "completed";
    }

    // Check previous step
    const prevStepStatus =
      index > 0
        ? determineStepStatus(allSteps[index - 1], index - 1, allSteps)
        : "completed";

    if (prevStepStatus === "completed") {
      return "active";
    }

    // Check for partial progress
    const { current, total } = step.computeProgress();
    if (current > 0) {
      return "active";
    }

    return "inactive";
  };

  // ✅ Define all steps
  const rawSteps: Step[] = [
    {
      id: "participants",
      text: "Registratie deelnemers",
      icon: <UserPlus className="w-4 h-4" />,
      computeStatus: () => {
        return (event.allowSelfRegistration
          ? event.maxParticipants === participants.length
          : true) &&
          participants.every((p) => p.confirmed) &&
          event.isInvited
          ? "completed"
          : "active";
      },
      computeProgress: () => ({
        current: confirmedParticipants.length,
        total: totalParticipants,
      }),
      info:
        unconfirmedParticipants.length > 0
          ? `${formatNamesWithLimit(unconfirmedParticipants)} ${
              unconfirmedParticipants.length === 1 ? "heeft" : "hebben"
            } nog niet bevestigd.`
          : "Alle deelnemers hebben zich geregistreerd voor het evenement.",
      actionText: "Deelnemers uitnodigen",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=invitation`,
      showActionForUser: event.allowSelfRegistration
        ? true
        : !participants.every((p) => p.confirmed),
      hoverText: getHoverText("participants"),
    },
    ...(event.isLootjesEvent ? [{
      id: "drawname",
      text: "Trek een naam",
      icon: <AlertCircle className="w-4 h-4" />,
      computeStatus: () =>
        drawnNames &&
        Object.keys(drawnNames).length === totalParticipants
          ? "completed"
          : "inactive",
      computeProgress: () => ({
        current: drawnNames ? Object.keys(drawnNames).length : 0,
        total: totalParticipants,
      }),
      info:
        drawnNames && Object.keys(drawnNames).length === participants.length
          ? "Alle deelnemers hebben een naam getrokken."
          : `${formatNamesWithLimit(
              participants.filter((p) => !drawnNames || !(p.id in drawnNames))
            )} ${
              participants.filter((p) => !drawnNames || !(p.id in drawnNames))
                .length === 1
                ? "heeft"
                : "hebben"
            } nog geen naam getrokken.`,
      actionText: "Stuur herinnering",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=drawn`,
      showActionForUser:
        drawnNames && Object.keys(drawnNames).length !== participants.length,
      hoverText: getHoverText("drawname"),
    }] : []),
    {
      id: "wishlist",
      text: "Koppel wishlist",
      icon: <ListChecks className="w-4 h-4" />,
      computeStatus: () =>
        (event.allowSelfRegistration
          ? participants.length === event.maxParticipants
          : true) && participants.every((i) => i.wishlistId)
          ? "completed"
          : "inactive",
      computeProgress: () => ({
        current: participantsWithWishlist.length,
        total: totalParticipants,
      }),
      info: participants.every((i) => i.wishlistId)
        ? "Alle deelnemers hebben een verlanglijstje toegevoegd."
        : `${formatNamesWithLimit(
            participants.filter((p) => !p.wishlistId)
          )} ${
            participants.filter((p) => !p.wishlistId).length === 1
              ? "heeft"
              : "hebben"
          } nog geen verlanglijstje toegevoegd.`,
      actionText: "Stuur herinnering",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=wishlist`,
      showActionForUser: !participants.every((i) => i.wishlistId),
      hoverText: getHoverText("wishlist"),
    },
    {
      id: "gift",
      text: "Koop een cadeau",
      icon: <GiftIcon className="w-4 h-4" />,
      computeStatus: () => {
        const allParticipantsPurchased = participants.every((participant) =>
          hasParticipantPurchasedForEvent(participant.id, event.id, wishlists)
        );
        return (event.allowSelfRegistration
          ? participants.length === event.maxParticipants
          : true) && allParticipantsPurchased
          ? "completed"
          : "inactive";
      },
      computeProgress: () => {
        const purchasedCount = participants.filter((p) =>
          hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
        ).length;
        return {
          current: purchasedCount,
          total: totalParticipants,
        };
      },
      info: participants.every((p) =>
        hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
      )
        ? "Alle deelnemers hebben een cadeau gekocht."
        : `${formatNamesWithLimit(
            participants.filter(
              (p) => !hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
            )
          )} ${
            participants.filter(
              (p) => !hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
            ).length === 1
              ? "heeft"
              : "hebben"
          } nog geen cadeau gekocht.`,
      actionText: "Stuur herinnering",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=crossOff`,
      showActionForUser: !participants.every((p) =>
        hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
      ),
      hoverText: getHoverText("gift"),
    },
    {
      id: "surprise",
      text: "Laat je verrassen!",
      icon: <PartyPopper className="w-4 h-4" />,
      computeStatus: () => (event.eventComplete ? "completed" : "inactive"),
      computeProgress: () => ({ current: 0, total: 1 }),
      info: "De grote dag komt eraan – voor je het weet is het zover! Laat je verrassen en geniet van het geven en ontvangen van cadeaus.",
      actionText: undefined,
      actionPath: "#",
      showActionForUser: false,
      hoverText: getHoverText("surprise"),
    },
  ];

  // ✅ Map steps with status
  const steps: (Step & { status: StepStatus })[] = rawSteps.map((step, index) => {
    const status = determineStepStatus(step, index, rawSteps);
    return { ...step, status };
  });

  // ✅ Get status visuals (WARM-OLIVE COLORS!)
  const getStatusVisuals = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return {
          bgColor: "bg-warm-olive",
          textColor: "text-olive-600",
          icon: <Check className="text-white w-4 h-4" />,
        };
      case "active":
        return {
          bgColor: "bg-warm-olive",
          textColor: "text-olive-600",
          icon: <Circle className="text-white w-4 h-4" strokeWidth={2} />,
        };
      default:
        return {
          bgColor: "bg-gray-300",
          textColor: "text-gray-400",
          icon: <X className="text-white w-4 h-4" />,
        };
    }
  };

  return (
    <>
      {/* ✅ MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{modalContent.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {modalContent.data.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    {section.title}
                  </h4>
                  {section.items.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Geen items</p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-warm-olive text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MAIN COMPONENT */}
      <div
        className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 mb-6"
        style={{ boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}
      >
        <h3 className="text-lg font-semibold mb-4">Evenement voortgang</h3>

        <ul className="space-y-3">
          {steps.map((step) => {
            const { bgColor, textColor, icon } = getStatusVisuals(step.status);
            const isHovered = hoveredStep === step.id;
            const isClickable = step.status !== "inactive";
            const { current, total } = step.computeProgress();
            const hasPartialProgress = current > 0 && current < total;

            return (
              <li
                key={step.id}
                className={`flex items-center py-1.5 ${
                  isClickable
                    ? "hover:bg-white/50 rounded-md cursor-pointer"
                    : ""
                }`}
                onMouseEnter={() => isClickable && setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => {
                  if (step.status === "inactive") return;
                  setActiveStep(activeStep === step.id ? null : step.id);
                }}
              >
                <div className="mr-3">
                  <div
                    className={`${bgColor} rounded-full w-6 h-6 flex items-center justify-center`}
                  >
                    {icon}
                  </div>
                </div>
                <div className="flex-grow flex items-center justify-between">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (step.status !== "inactive") {
                        openModal(step.id);
                      }
                    }}
                    className={`${textColor} ${
                      step.status === "completed" ? "font-medium" : ""
                    } transition-all duration-200`}
                  >
                    {/* ✅ SHOW HOVER TEXT when hovering OR for organizer */}
                    {isOrganizer || isHovered ? step.hoverText : step.text}
                  </span>
                  {/* ✅ PROGRESS NUMBERS (X/Y) */}
                  {hasPartialProgress && (
                    <span className="text-xs text-gray-500 ml-2">
                      {getProgressText(step.id)}
                    </span>
                  )}
                </div>
                {step.status !== "inactive" && (
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transform transition-transform ml-2 ${
                      activeStep === step.id ? "rotate-90" : ""
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* ✅ EXPANDED INFO */}
        {activeStep && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
            {steps.map(
              (step) =>
                step.id === activeStep && (
                  <div key={`info-${step.id}`} className="space-y-3">
                    <p className="text-sm text-gray-600">{step.info}</p>
                    {step.showActionForUser && step.actionPath && (
                      step.actionPath === "#" ? (
                        <button
                          onClick={() => step.onClick && step.onClick()}
                          className={`text-white max-w-[200px] justify-center px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                            getStatusVisuals(step.status).bgColor
                          }`}
                        >
                          {step.icon}
                          <span className="ml-2">{step.actionText}</span>
                        </button>
                      ) : (
                        <Link
                          href={step.actionPath}
                          className={`text-white max-w-[200px] justify-center px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                            getStatusVisuals(step.status).bgColor
                          }`}
                        >
                          {step.icon}
                          <span className="ml-2">{step.actionText}</span>
                        </Link>
                      )
                    )}
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AdvancedEventProgressChecklist;