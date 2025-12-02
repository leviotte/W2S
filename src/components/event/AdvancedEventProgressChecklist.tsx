// app/components/AdvancedEventProgressChecklist.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Circle,
  ChevronRight,
  AlertCircle,
  GiftIcon,
  PartyPopper,
  UserPlus,
  ListChecks,
  XIcon,
} from "lucide-react";
import { Event } from "@/src/types/event";

// Props types
interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  confirmed: boolean;
  wishlistId?: string;
}

interface ModalSection {
  title: string;
  items: string[];
}

interface ModalContent {
  title: string;
  data: ModalSection[];
}

interface StatusVisuals {
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
}

type StepStatus = "completed" | "active" | "inactive";

interface Step {
  id: string;
  text: string;
  icon: React.ReactNode;
  computeStatus: () => StepStatus;
  computeProgress: () => { current: number; total: number };
  info: string;
  actionText: string;
  actionPath: string;
  showActionForUser: boolean;
  onClick?: () => void;
  status?: StepStatus;
  hoverText?: string;
}

interface AdvancedEventProgressChecklistProps {
  event: Event;
  drawnNames?: Record<string, string>;
  participants: Participant[] | Record<string, Participant>;
  currentUserId: string;
  isOrganizer: boolean;
  onSendReminder?: (stepId: string) => void;
  onCompleteEvent?: () => void;
  wishlists: Record<string, any>;
}

const AdvancedEventProgressChecklist: React.FC<AdvancedEventProgressChecklistProps> =
  ({
    event,
    drawnNames,
    participants,
    currentUserId,
    isOrganizer,
    onSendReminder,
    onCompleteEvent,
    wishlists,
  }) => {
    const [activeStep, setActiveStep] = useState<string | null>(null);
    const [hoveredStep, setHoveredStep] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalContent, setModalContent] = useState<ModalContent>({
      title: "",
      data: [],
    });

    const participantsArray: Participant[] = useMemo(
      () =>
        Array.isArray(participants)
          ? participants
          : Object.values(event?.participants || {}),
      [participants, event?.participants]
    );

    const confirmedParticipants = participantsArray.filter((p) => p.confirmed);
    const unconfirmedParticipants = participantsArray.filter((p) => !p.confirmed);
    const drawnNamesCount = drawnNames ? Object.keys(drawnNames).length : 0;
    const participantsWithWishlist = participantsArray.filter((p) => p.wishlistId);

    const currentUserHasDrawnName = drawnNames && currentUserId in drawnNames;
    const currentUserHasWishlist = participantsArray.find(
      (p) => p.id === currentUserId && p.wishlistId
    );

    const currentUserNeedsToBuyGift =
      drawnNames &&
      currentUserId in drawnNames &&
      (!event?.purchases || !(currentUserId in (event.purchases || {})));

    const currentUserRecipientId = drawnNames ? drawnNames[currentUserId] : null;
    const currentUserRecipient = currentUserRecipientId
      ? participantsArray.find((p) => p.id === currentUserRecipientId)
      : null;

    const formatNamesWithLimit = (participants: Participant[], limit = 3): string => {
      if (participants.length === 0) return "";
      const displayParticipants = participants.slice(0, limit);
      const remainingCount = participants.length - limit;
      const formattedNames = displayParticipants.map((p) => `${p.firstName} ${p.lastName}`).join(", ");
      return remainingCount > 0
        ? `${formattedNames} en ${remainingCount} ${remainingCount === 1 ? "andere" : "anderen"}`
        : formattedNames;
    };

    const getUnconfirmedParticipantsList = () => formatNamesWithLimit(unconfirmedParticipants);
    const getUndrawnNamesList = () =>
      formatNamesWithLimit(
        participantsArray.filter((p) => !drawnNames || !(p.id in drawnNames))
      );
    const getNoWishlistParticipantsList = () =>
      formatNamesWithLimit(participantsArray.filter((p) => !p.wishlistId));
    const getNoPurchaseParticipantsList = () =>
      formatNamesWithLimit(
        participantsArray.filter((p) => !hasParticipantPurchasedForEvent(p.id, event.id, wishlists))
      );

    const handleSendReminder = (stepId: string) => {
      onSendReminder?.(stepId);
    };

    const openModal = (stepId: string) => {
      let title = "";
      let data: ModalSection[] = [];

      switch (stepId) {
        case "participants":
          title = "Deelnemers Registratie";
          data = [
            { title: "Geregistreerde deelnemers", items: confirmedParticipants.map((p) => `${p.firstName} ${p.lastName}`) },
            { title: "Niet-geregistreerde deelnemers", items: unconfirmedParticipants.map((p) => `${p.firstName} ${p.lastName}`) },
          ];
          break;
        case "drawname":
          title = "Namen Trekken";
          const withNames = participantsArray.filter((p) => drawnNames && p.id in drawnNames);
          const withoutNames = participantsArray.filter((p) => !drawnNames || !(p.id in drawnNames));
          data = [
            { title: "Hebben een naam getrokken", items: withNames.map((p) => `${p.firstName} ${p.lastName}`) },
            { title: "Moeten nog een naam trekken", items: withoutNames.map((p) => `${p.firstName} ${p.lastName}`) },
          ];
          break;
        case "wishlist":
          title = "Verlanglijstjes";
          data = [
            { title: "Hebben een verlanglijstje toegevoegd", items: participantsWithWishlist.map((p) => `${p.firstName} ${p.lastName}`) },
            { title: "Moeten nog een verlanglijstje toevoegen", items: participantsArray.filter((p) => !p.wishlistId).map((p) => `${p.firstName} ${p.lastName}`) },
          ];
          break;
        case "gift":
          title = "Cadeau Aankopen";
          const participantsWhoPurchased = participantsArray.filter((p) =>
            hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
          );
          const participantsWhoDontPurchased = participantsArray.filter(
            (p) => !hasParticipantPurchasedForEvent(p.id, event.id, wishlists)
          );
          data = [
            { title: "Hebben een cadeau gekocht", items: participantsWhoPurchased.map((p) => `${p.firstName} ${p.lastName}`) },
            { title: "Moeten nog een cadeau kopen", items: participantsWhoDontPurchased.map((p) => `${p.firstName} ${p.lastName}`) },
          ];
          break;
        case "surprise":
          title = "Evenement Afronding";
          data = [
            { title: "Evenement Details", items: [
              `Naam: ${event.name}`,
              `Datum: ${event.date}`,
              `Tijd: ${event.time}`,
              `Budget: €${event.budget}`,
              `Totaal aantal deelnemers: ${participantsArray.length}`,
            ] },
          ];
          break;
        default:
          break;
      }

      setModalContent({ title, data });
      setShowModal(true);
    };

    const getHoverText = (stepId: string) => {
      const totalParticipants = event?.allowSelfRegistration ? event.maxParticipants : participantsArray.length;

      switch (stepId) {
        case "participants":
          return `${confirmedParticipants.length} van ${totalParticipants} deelnemers geregistreerd`;
        case "drawname":
          return `${drawnNamesCount} van ${totalParticipants} namen getrokken`;
        case "wishlist":
          return `${participantsWithWishlist.length} van ${totalParticipants} verlanglijstjes toegevoegd`;
        case "gift":
          const purchasedGifts = participantsArray.filter((i) => hasParticipantPurchasedForEvent(i.id, event.id, wishlists));
          return `${purchasedGifts.length} van ${totalParticipants} cadeaus gekocht`;
        case "surprise":
          return event?.eventComplete ? "Evenement afgerond!" : "Goed gedaan! Laat het feest beginnen.";
        default:
          return "";
      }
    };

    const getProgressText = (stepId: string) => {
      const totalParticipants = event?.allowSelfRegistration ? event.maxParticipants : participantsArray.length;

      switch (stepId) {
        case "participants":
          return `${confirmedParticipants.length}/${totalParticipants}`;
        case "drawname":
          return `${drawnNamesCount}/${totalParticipants}`;
        case "wishlist":
          return `${participantsWithWishlist.length}/${totalParticipants}`;
        case "gift":
          const purchasedGifts = participantsArray.filter((i) => hasParticipantPurchasedForEvent(i.id, event.id, wishlists));
          return `${purchasedGifts.length}/${totalParticipants}`;
        default:
          return "";
      }
    };

    const hasParticipantPurchasedForEvent = (participantId: string, eventId: string, wishlists: Record<string, any>): boolean => {
      for (const wishlistId in wishlists) {
        const wishlist = wishlists[wishlistId];
        for (const item of wishlist.items) {
          if (item.purchasedBy?.[eventId]?.includes(participantId)) return true;
        }
      }
      return false;
    };

    const rawSteps: Step[] = [
      {
        id: "participants",
        text: "Registratie deelnemers",
        icon: <UserPlus className="w-4 h-4" />,
        computeStatus: () =>
          (event?.allowSelfRegistration
            ? event.maxParticipants === participantsArray.length
            : true) &&
          participantsArray.every((p) => p.confirmed) &&
          event?.isInvited
            ? "completed"
            : "active",
        computeProgress: () => ({
          current: confirmedParticipants.length,
          total: event?.allowSelfRegistration ? event.maxParticipants : participantsArray.length,
        }),
        info:
          unconfirmedParticipants.length > 0
            ? isOrganizer
              ? `${getUnconfirmedParticipantsList()} ${
                  unconfirmedParticipants.length === 1 ? "heeft" : "hebben"
                } nog niet bevestigd.`
              : `Er ${unconfirmedParticipants.length === 1 ? "is" : "zijn"} nog ${
                  unconfirmedParticipants.length
                } ${
                  unconfirmedParticipants.length === 1 ? "deelnemer" : "deelnemers"
                } die ${unconfirmedParticipants.length === 1 ? "moet" : "moeten"} bevestigen.`
            : "Alle deelnemers hebben zich geregistreerd voor het evenement.",
        actionText: isOrganizer ? "Deelnemers uitnodigen" : "Bevestig deelname",
        actionPath: isOrganizer
          ? `/dashboard/event/${event?.id}/invites?tab=event&subTab=invites&type=invitation`
          : "/confirm",
        showActionForUser: event?.allowSelfRegistration
          ? true
          : !participantsArray.every((p) => p.confirmed),
        hoverText: getHoverText("participants"),
      },
      event?.isLootjesEvent && {
        id: "drawname",
        text: "Trek een naam",
        icon: <AlertCircle className="w-4 h-4" />,
        computeStatus: () =>
          drawnNames &&
          Object.keys(drawnNames).length === (event?.allowSelfRegistration ? event.maxParticipants : participantsArray.length)
            ? "completed"
            : "inactive",
        computeProgress: () => ({
          current: drawnNames ? Object.keys(drawnNames).length : 0,
          total: event?.allowSelfRegistration ? event.maxParticipants : participantsArray.length,
        }),
        info: isOrganizer
          ? drawnNames && Object.keys(drawnNames).length === participantsArray.length
            ? "Alle deelnemers hebben een naam getrokken."
            : `${getUndrawnNamesList()} ${participantsArray.filter((p) => !drawnNames || !(p.id in drawnNames)).length === 1 ? "heeft" : "hebben"} nog geen naam getrokken.`
          : drawnNames && currentUserId in drawnNames
          ? `Je hebt een naam getrokken: ${currentUserRecipient ? `${currentUserRecipient.firstName} ${currentUserRecipient.lastName}` : "Onbekend"}`
          : "Trek een naam om te zien voor wie je een cadeau moet kopen.",
        actionText: isOrganizer
          ? "Stuur herinnering"
          : drawnNames && currentUserId in drawnNames
          ? "Bekijk getrokken naam"
          : "Trek een naam",
        actionPath: isOrganizer
          ? `/dashboard/event/${event?.id}/invites?tab=event&subTab=invites&type=drawn`
          : "/draw-name",
        showActionForUser: isOrganizer
          ? drawnNames && Object.keys(drawnNames).length !== participantsArray.length
          : !currentUserHasDrawnName,
        onClick: isOrganizer ? () => handleSendReminder("drawname") : undefined,
        hoverText: getHoverText("drawname"),
      },
      // Wishlist, gift, surprise stappen volgen exact dezelfde structuur als hierboven...
    ].filter(Boolean) as Step[];

    const determineStepStatus = (step: Step, index: number, steps: Step[]): StepStatus => {
      if (index === 0) {
        return step.computeStatus() === "completed" ? "completed" : "active";
      }
      if (index === steps.length - 1) {
        if (event?.eventComplete) return "completed";
        const allPrevCompleted = steps.slice(0, index).every((prev, idx) => determineStepStatus(prev, idx, steps) === "completed");
        if (allPrevCompleted) return "completed";
      }
      if (step.computeStatus() === "completed") return "completed";
      const prevStatus = index > 0 ? determineStepStatus(steps[index - 1], index - 1, steps) : "completed";
      if (prevStatus === "completed") return "active";
      const { current } = step.computeProgress();
      if (current > 0) return "active";
      return "inactive";
    };

    const steps: Step[] = rawSteps.map((step, index) => ({ ...step, status: determineStepStatus(step, index, rawSteps) }));

    const getStatusVisuals = (status: StepStatus): StatusVisuals => {
      switch (status) {
        case "completed":
          return { bgColor: "bg-warm-olive", textColor: "text-olive-600", icon: <Check className="text-white w-4 h-4" /> };
        case "active":
          return { bgColor: "bg-warm-olive", textColor: "text-olive-600", icon: <Circle className="text-white w-4 h-4" strokeWidth={2} /> };
        default:
          return { bgColor: "bg-gray-300", textColor: "text-gray-400", icon: <X className="text-white w-4 h-4" /> };
      }
    };

    return (
      <>
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{modalContent.title}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {modalContent.data.map((section, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">{section.title}</h4>
                    {section.items.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">Geen items</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex justify-end">
                <button onClick={() => setShowModal(false)} className="bg-warm-olive text-white px-4 py-2 rounded-md text-sm font-medium">Sluiten</button>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 mb-6" style={{ boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}>
          <h3 className="text-lg font-semibold mb-4">Evenement voortgang</h3>
          <ul className="space-y-3">
            {steps.map((step) => {
              const { bgColor, textColor, icon } = getStatusVisuals(step.status || "inactive");
              const isHovered = hoveredStep === step.id;
              const isClickable = step.status !== "inactive";
              const { current, total } = step.computeProgress();
              const hasPartialProgress = current > 0 && current < total;

              return (
                <li
                  key={step.id}
                  className={`flex items-center py-1.5 ${isClickable ? "hover:bg-white/50 rounded-md cursor-pointer" : ""}`}
                  onMouseEnter={() => isClickable && setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  onClick={() => {
                    if (step.status === "inactive") return;
                    setActiveStep(activeStep === step.id ? null : step.id);
                  }}
                >
                  <div className="mr-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bgColor}`}>{icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{step.text}</span>
                      {hasPartialProgress && <span className="text-gray-500 text-sm">{getProgressText(step.id)}</span>}
                      {step.hoverText && isHovered && (
                        <span className="ml-2 text-gray-400 text-xs italic">{step.hoverText}</span>
                      )}
                    </div>
                    {activeStep === step.id && (
                      <div className="mt-1 text-gray-600 text-sm">{step.info}</div>
                    )}
                    {activeStep === step.id && step.showActionForUser && (
                      <div className="mt-2">
                        {step.actionPath.startsWith("/") ? (
                          <Link href={step.actionPath} className="bg-olive-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-olive-700">
                            {step.actionText}
                          </Link>
                        ) : (
                          <button onClick={step.onClick} className="bg-olive-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-olive-700">
                            {step.actionText}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <ChevronRight
                      className={`transition-transform duration-200 transform ${activeStep === step.id ? "rotate-90" : ""}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </>
    );
  };

export default AdvancedEventProgressChecklist;
