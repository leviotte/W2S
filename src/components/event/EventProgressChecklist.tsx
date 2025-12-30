// src/components/event/EventProgressChecklist.tsx
"use client";

import React, { FC, useState, useMemo } from "react";
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
  X as XIcon,
} from "lucide-react";

import type { Event, EventParticipant } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";
import { Button } from "@/components/ui/button";

interface Props {
  event: Event;
  participants: EventParticipant[];
  wishlists: Record<string, Wishlist>;
  currentUserId: string;
  isOrganizer: boolean;
}

type StepStatus = "completed" | "active" | "inactive";

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

interface ModalSection {
  title: string;
  items: string[];
}

interface ModalContent {
  title: string;
  sections: ModalSection[];
}

const AdvancedEventProgressChecklist: FC<Props> = ({
  event,
  participants,
  wishlists,
  currentUserId,
  isOrganizer,
}) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "",
    sections: [],
  });

  // -----------------------------
  // Memoized Computed Values
  // -----------------------------
  const confirmedParticipants = useMemo(
    () => participants.filter((p) => p.confirmed),
    [participants]
  );
  const unconfirmedParticipants = useMemo(
    () => participants.filter((p) => !p.confirmed),
    [participants]
  );
  const drawnNames = event.drawnNames || {};
  const drawnNamesCount = useMemo(() => Object.keys(drawnNames).length, [drawnNames]);
  const participantsWithWishlist = useMemo(() => participants.filter((p) => p.wishlistId), [participants]);

  const totalParticipants = event.allowSelfRegistration ? event.maxParticipants : participants.length;

  // -----------------------------
  // Helpers
  // -----------------------------
  const hasPurchased = (participantId: string) =>
    Object.values(wishlists).some((wishlist) =>
      wishlist.items?.some(
        (item) => item.multiPurchasedBy?.[event.id]?.includes(participantId)
      )
    );

  const formatNames = (list: EventParticipant[], limit = 3) => {
    if (!list.length) return "";
    const names = list.slice(0, limit).map((p) => `${p.firstName} ${p.lastName}`);
    const remaining = list.length - limit;
    return remaining > 0 ? `${names.join(", ")} en ${remaining} ${remaining === 1 ? "andere" : "anderen"}` : names.join(", ");
  };

  const getHoverText = (id: string) => {
    switch (id) {
      case "participants":
        return `${confirmedParticipants.length}/${totalParticipants} deelnemers geregistreerd`;
      case "drawname":
        return `${drawnNamesCount}/${totalParticipants} namen getrokken`;
      case "wishlist":
        return `${participantsWithWishlist.length}/${totalParticipants} verlanglijstjes toegevoegd`;
      case "gift":
        const purchased = participants.filter((p) => hasPurchased(p.id));
        return `${purchased.length}/${totalParticipants} cadeaus gekocht`;
      case "surprise":
        return event.eventComplete ? "Evenement afgerond!" : "Goed gedaan! Laat het feest beginnen.";
      default:
        return "";
    }
  };

  const getProgressText = (id: string) => {
    switch (id) {
      case "participants":
        return `${confirmedParticipants.length}/${totalParticipants}`;
      case "drawname":
        return `${drawnNamesCount}/${totalParticipants}`;
      case "wishlist":
        return `${participantsWithWishlist.length}/${totalParticipants}`;
      case "gift":
        const purchased = participants.filter((p) => hasPurchased(p.id));
        return `${purchased.length}/${totalParticipants}`;
      default:
        return "";
    }
  };

  const openModal = (stepId: string) => {
    let title = "";
    let sections: ModalSection[] = [];

    switch (stepId) {
      case "participants":
        title = "Deelnemers Registratie";
        sections = [
          { title: "Geregistreerde deelnemers", items: confirmedParticipants.map((p) => `${p.firstName} ${p.lastName}`) },
          { title: "Niet-geregistreerde deelnemers", items: unconfirmedParticipants.map((p) => `${p.firstName} ${p.lastName}`) },
        ];
        break;

      case "drawname":
        title = "Namen Trekken";
        sections = [
          { title: "Hebben een naam getrokken", items: participants.filter((p) => p.id in drawnNames).map((p) => `${p.firstName} ${p.lastName}`) },
          { title: "Moeten nog een naam trekken", items: participants.filter((p) => !(p.id in drawnNames)).map((p) => `${p.firstName} ${p.lastName}`) },
        ];
        break;

      case "wishlist":
        title = "Verlanglijstjes";
        sections = [
          { title: "Hebben toegevoegd", items: participantsWithWishlist.map((p) => `${p.firstName} ${p.lastName}`) },
          { title: "Moeten nog toevoegen", items: participants.filter((p) => !p.wishlistId).map((p) => `${p.firstName} ${p.lastName}`) },
        ];
        break;

      case "gift":
        title = "Cadeau Aankopen";
        sections = [
          { title: "Hebben gekocht", items: participants.filter((p) => hasPurchased(p.id)).map((p) => `${p.firstName} ${p.lastName}`) },
          { title: "Moeten nog kopen", items: participants.filter((p) => !hasPurchased(p.id)).map((p) => `${p.firstName} ${p.lastName}`) },
        ];
        break;

      case "surprise":
  title = "Evenement Afronding";

  // 🔹 VOEG HIER TOE
  const eventDate = new Date(event.startDateTime);
  const formattedDate = eventDate.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formattedTime = eventDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

  sections = [
    {
      title: "Evenement Details",
      items: [
        `Naam: ${event.name}`,
        `Datum: ${formattedDate}`,
        `Tijd: ${formattedTime}`,
        `Budget: €${event.budget}`,
        `Totaal aantal deelnemers: ${participants.length}`,
      ],
    },
  ];
  break;

      default:
        break;
    }

    setModalContent({ title, sections });
    setShowModal(true);
  };

  // -----------------------------
  // Steps Definition
  // -----------------------------
  const steps: Step[] = [
    {
      id: "participants",
      text: "Registratie deelnemers",
      icon: <UserPlus className="w-4 h-4" />,
      computeStatus: () =>
        participants.every((p) => p.confirmed) && event.isInvited ? "completed" : "active",
      computeProgress: () => ({ current: confirmedParticipants.length, total: totalParticipants }),
      info: unconfirmedParticipants.length
        ? `${formatNames(unconfirmedParticipants)} ${unconfirmedParticipants.length === 1 ? "heeft" : "hebben"} nog niet bevestigd.`
        : "Alle deelnemers hebben zich geregistreerd.",
      actionText: "Deelnemers uitnodigen",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=invitation`,
      showActionForUser: !participants.every((p) => p.confirmed),
      hoverText: getHoverText("participants"),
    },
    ...(event.isLootjesEvent
      ? [
          {
            id: "drawname",
            text: "Trek een naam",
            icon: <AlertCircle className="w-4 h-4" />,
            computeStatus: () =>
              drawnNamesCount === totalParticipants ? "completed" : "inactive",
            computeProgress: () => ({ current: drawnNamesCount, total: totalParticipants }),
            info: drawnNamesCount === totalParticipants
              ? "Alle deelnemers hebben een naam getrokken."
              : `${formatNames(participants.filter((p) => !(p.id in drawnNames)))} nog geen naam getrokken.`,
            actionText: "Stuur herinnering",
            actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=drawn`,
            showActionForUser: drawnNamesCount !== totalParticipants,
            hoverText: getHoverText("drawname"),
          },
        ]
      : []),
    {
      id: "wishlist",
      text: "Koppel wishlist",
      icon: <ListChecks className="w-4 h-4" />,
      computeStatus: () =>
        participants.every((p) => p.wishlistId) ? "completed" : "inactive",
      computeProgress: () => ({ current: participantsWithWishlist.length, total: totalParticipants }),
      info: participants.every((p) => p.wishlistId)
        ? "Alle deelnemers hebben een verlanglijstje toegevoegd."
        : `${formatNames(participants.filter((p) => !p.wishlistId))} nog geen verlanglijstje toegevoegd.`,
      actionText: "Stuur herinnering",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=wishlist`,
      showActionForUser: !participants.every((p) => p.wishlistId),
      hoverText: getHoverText("wishlist"),
    },
    {
      id: "gift",
      text: "Koop een cadeau",
      icon: <GiftIcon className="w-4 h-4" />,
      computeStatus: () =>
        participants.every((p) => hasPurchased(p.id)) ? "completed" : "inactive",
      computeProgress: () => ({
        current: participants.filter((p) => hasPurchased(p.id)).length,
        total: totalParticipants,
      }),
      info: participants.every((p) => hasPurchased(p.id))
        ? "Alle deelnemers hebben een cadeau gekocht."
        : `${formatNames(participants.filter((p) => !hasPurchased(p.id)))} nog geen cadeau gekocht.`,
      actionText: "Stuur herinnering",
      actionPath: `/dashboard/event/${event.id}/invites?tab=event&subTab=invites&type=crossOff`,
      showActionForUser: !participants.every((p) => hasPurchased(p.id)),
      hoverText: getHoverText("gift"),
    },
    {
      id: "surprise",
      text: "Laat je verrassen!",
      icon: <PartyPopper className="w-4 h-4" />,
      computeStatus: () => (event.eventComplete ? "completed" : "inactive"),
      computeProgress: () => ({ current: 0, total: 1 }),
      info: "De grote dag komt eraan – laat je verrassen en geniet van het geven en ontvangen van cadeaus.",
      showActionForUser: false,
      hoverText: getHoverText("surprise"),
    },
  ];

  const determineStepStatus = (step: Step, index: number): StepStatus => {
  const currentStatus = step.computeStatus();
  if (currentStatus === "completed") return "completed";

  if (index === 0) return "active"; // eerste step wordt altijd actief tenzij completed

  const prevStatus = determineStepStatus(steps[index - 1], index - 1);
  return prevStatus === "completed" ? "active" : "inactive";
};

  const getStatusVisuals = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return { bg: "bg-warm-olive", text: "text-olive-600", icon: <Check className="w-4 h-4 text-white" /> };
      case "active":
        return { bg: "bg-warm-olive", text: "text-olive-600", icon: <Circle className="w-4 h-4 text-white" strokeWidth={2} /> };
      case "inactive":
      default:
        return { bg: "bg-gray-300", text: "text-gray-400", icon: <X className="w-4 h-4 text-white" /> };
    }
  };

  return (
    <>
      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{modalContent.title}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {modalContent.sections.map((sec, idx) => (
                <div key={idx} className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">{sec.title}</h4>
                  {sec.items.length ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {sec.items.map((item, i) => (
                        <li key={i} className="text-gray-600">{item}</li>
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

      {/* MAIN CHECKLIST */}
      <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Evenement voortgang</h3>
        <ul className="space-y-3">
          {steps.map((step, idx) => {
            const status = determineStepStatus(step, idx);
            const { bg, text, icon } = getStatusVisuals(status);
            const progress = step.computeProgress();
            const partial = progress.current > 0 && progress.current < progress.total;
            const hovered = hoveredStep === step.id;

            return (
              <li
                key={step.id}
                className={`flex items-center py-1.5 ${status !== "inactive" ? "hover:bg-white/50 rounded-md cursor-pointer" : ""}`}
                onMouseEnter={() => status !== "inactive" && setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => status !== "inactive" && setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <div className="mr-3">
                  <div className={`${bg} rounded-full w-6 h-6 flex items-center justify-center`}>{icon}</div>
                </div>
                <div className="flex-grow flex items-center justify-between">
                  <span
                    onClick={(e) => { e.stopPropagation(); openModal(step.id); }}
                    className={`${text} ${status === "completed" ? "font-medium" : ""} transition-all duration-200`}
                  >
                    {isOrganizer || hovered ? step.hoverText : step.text}
                  </span>
                  {partial && <span className="text-xs text-gray-500 ml-2">{getProgressText(step.id)}</span>}
                </div>
                {status !== "inactive" && (
                  <ChevronRight className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${activeStep === step.id ? "rotate-90" : ""}`} />
                )}
              </li>
            );
          })}
        </ul>

        {activeStep && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
            {steps
              .filter((s) => s.id === activeStep)
              .map((step) => (
                <div key={step.id} className="space-y-3">
                  <p className="text-sm text-gray-600">{step.info}</p>
                  {step.showActionForUser && step.actionPath && (
                    step.actionPath === "#" ? (
                      <button onClick={step.onClick} className={`text-white max-w-[200px] px-4 py-2 rounded-md text-sm font-medium flex items-center ${getStatusVisuals(determineStepStatus(step, steps.indexOf(step))).bg}`}>
                        {step.icon}<span className="ml-2">{step.actionText}</span>
                      </button>
                    ) : (
                      <Link href={step.actionPath} className={`text-white max-w-[200px] px-4 py-2 rounded-md text-sm font-medium flex items-center ${getStatusVisuals(determineStepStatus(step, steps.indexOf(step))).bg}`}>
                        {step.icon}<span className="ml-2">{step.actionText}</span>
                      </Link>
                    )
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdvancedEventProgressChecklist;
