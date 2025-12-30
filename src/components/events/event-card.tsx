// src/components/events/event-card.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MoreVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  UserPlus,
  AlertCircle,
  ListChecks,
  Gift,
  PartyPopper,
} from "lucide-react";
import CountdownTimer from "@/components/shared/countdown-timer";
import TodoItem from "./todo-item";
import type { Event, EventParticipant } from "@/types/event";
import type { Wishlist } from "@/types/wishlist";

interface EventCardProps {
  event: Event;
  currentUserId: string;
  wishlists?: Record<string, Wishlist>;
  onDelete?: (eventId: string) => void;
}

interface Todo {
  id: string;
  label: string;
  icon: React.ReactNode;
  computeStatus: () => boolean;
  hoverText: string;
  visible: boolean;
  order: number;
}

export default function EventCard({
  event,
  currentUserId,
  wishlists = {},
  onDelete,
}: EventCardProps) {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const isOrganizer = event.organizerId === currentUserId || event.organizer === currentUserId;

  // Convert participants
  const participantsArray: EventParticipant[] = Object.values(event.participants || {});
  const confirmedParticipants = participantsArray.filter((p) => p.confirmed);
  const drawnNames = event.drawnNames || {};
  const drawnNamesCount = Object.keys(drawnNames).length;
  const participantsWithWishlist = participantsArray.filter((p) => p.wishlistId);

  // Current user participant
  const currentUserParticipant = participantsArray.find((p) => p.id === currentUserId);

  // Helper: check if participant purchased for event
  const hasParticipantPurchasedForEvent = (
    participantId: string,
    eventId: string,
    wishlists: Record<string, Wishlist>
  ): boolean => {
    for (const wishlistId in wishlists) {
      const wishlist = wishlists[wishlistId];
      for (const item of wishlist.items || []) {
        if (
          item.purchasedBy &&
          item.multiPurchasedBy?.[eventId]?.includes(participantId)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // Get hover text for each step
  const getHoverText = (stepId: string): string => {
    const totalParticipants = participantsArray.length;

    switch (stepId) {
      case "participants":
        return `${confirmedParticipants.length} van ${totalParticipants} deelnemers geregistreerd`;
      case "drawname":
        return `${drawnNamesCount} van ${totalParticipants} namen getrokken`;
      case "wishlist":
        return `${participantsWithWishlist.length} van ${totalParticipants} verlanglijstjes toegevoegd`;
      case "gift":
        const purchasedGifts = participantsArray.filter((p) =>
          hasParticipantPurchasedForEvent(p.id, event.id, wishlists || {})
        );
        return `${purchasedGifts.length} van ${totalParticipants} cadeaus gekocht`;
      case "surprise":
        return event.eventComplete
          ? "Evenement afgerond!"
          : `goed gedaan! Laat het feest beginnen.`;
      default:
        return "";
    }
  };

  // Non-organizer status checks
  const isParticipationComplete = () => currentUserParticipant?.confirmed === true;
  const isDrawnameComplete = () => currentUserId && drawnNames && drawnNames[currentUserId] ? true : false;
  const isWishlistComplete = () => currentUserParticipant?.wishlistId ? true : false;
  const isGiftComplete = () =>
    hasParticipantPurchasedForEvent(currentUserId || "", event.id, wishlists || {});

  // Todo list
  const todoList: Todo[] = [
    {
      id: "participants",
      label: "Registratie deelnemers",
      icon: <UserPlus className="w-4 h-4" />,
      computeStatus: () => participantsArray?.every((i) => i.confirmed) && true,
      hoverText: getHoverText("participants"),
      visible: true,
      order: 1,
    },
    {
      id: "drawname",
      label: "Trek een naam",
      icon: <AlertCircle className="w-4 h-4" />,
      computeStatus: () =>
        drawnNames && Object.keys(drawnNames).length === participantsArray.length,
      hoverText: getHoverText("drawname"),
      visible: !!event.isLootjesEvent,
      order: 2,
    },
    {
      id: "wishlist",
      label: "Koppel wishlist",
      icon: <ListChecks className="w-4 h-4" />,
      computeStatus: () => participantsArray.every((i) => i.wishlistId),
      hoverText: getHoverText("wishlist"),
      visible: true,
      order: 3,
    },
    {
      id: "gift",
      label: "Koop een cadeau",
      icon: <Gift className="w-4 h-4" />,
      computeStatus: () => {
        return participantsArray.every((participant) =>
          hasParticipantPurchasedForEvent(participant.id, event.id, wishlists || {})
        );
      },
      hoverText: getHoverText("gift"),
      visible: true,
      order: 4,
    },
    {
      id: "surprise",
      label: "Laat je verrassen!",
      icon: <PartyPopper className="w-4 h-4" />,
      computeStatus: () => Boolean(event.eventComplete),
      hoverText: getHoverText("surprise"),
      visible: true,
      order: 5,
    },
  ].filter((todo) => todo.visible);

  const sortedTodoList = [...todoList].sort((a, b) => a.order - b.order);

  // Get todo status
  const getTodoStatus = (
    todo: Todo,
    index: number
  ): "inactive" | "active" | "complete" => {
    if (isOrganizer) {
      // Organizer view
      if (index === 0) {
        if (event.isInvited && participantsArray.every((p) => p.confirmed)) {
          return "complete";
        }
        return "active";
      }

      if (index === sortedTodoList.length - 1) {
        if (event.eventComplete) {
          return "complete";
        }
        const allPreviousStepsComplete = sortedTodoList
          .slice(0, index)
          .every((prevTodo) => prevTodo.computeStatus());
        if (allPreviousStepsComplete) {
          return "complete";
        }
      }

      if (todo.computeStatus()) {
        return "complete";
      }

      const prevTodo = sortedTodoList[index - 1];
      if (prevTodo && prevTodo.computeStatus()) {
        return "active";
      }

      switch (todo.id) {
        case "participants":
          return confirmedParticipants.length > 0 ? "active" : "inactive";
        case "drawname":
          return drawnNamesCount > 0 ? "active" : "inactive";
        case "wishlist":
          return participantsWithWishlist.length > 0 ? "active" : "inactive";
        case "gift":
          const purchasedGiftsCount = participantsArray.filter((p) =>
            hasParticipantPurchasedForEvent(p.id, event.id, wishlists || {})
          ).length;
          return purchasedGiftsCount > 0 ? "active" : "inactive";
        default:
          return "inactive";
      }
    } else {
      // Non-organizer view
      if (index === 0) {
        return isParticipationComplete() ? "complete" : "active";
      }

      if (index === sortedTodoList.length - 1) {
        if (event.eventComplete) {
          return "complete";
        }
        const allPreviousStepsComplete = [
          isParticipationComplete(),
          !event.isLootjesEvent || isDrawnameComplete(),
          isWishlistComplete(),
          !event.isInvited || isGiftComplete(),
        ].every(Boolean);
        if (allPreviousStepsComplete) {
          return "complete";
        }
      }

      const isThisStepComplete = () => {
        switch (todo.id) {
          case "participants":
            return isParticipationComplete();
          case "drawname":
            return isDrawnameComplete();
          case "wishlist":
            return isWishlistComplete();
          case "gift":
            return isGiftComplete();
          case "surprise":
            return Boolean(event.eventComplete);
          default:
            return false;
        }
      };

      if (isThisStepComplete()) {
        return "complete";
      }

      if (index > 0) {
        const prevTodo = sortedTodoList[index - 1];
        const isPrevStepComplete = () => {
          switch (prevTodo.id) {
            case "participants":
              return isParticipationComplete();
            case "drawname":
              return isDrawnameComplete();
            case "wishlist":
              return isWishlistComplete();
            case "gift":
              return isGiftComplete();
            default:
              return false;
          }
        };

        if (isPrevStepComplete()) {
          return "active";
        }
      }

      if (todo.id === "drawname" && !event.isLootjesEvent) {
        return "inactive";
      }

      if (todo.id === "gift" && !event.isInvited) {
        return "inactive";
      }

      switch (todo.id) {
        case "participants":
          return "active";
        case "drawname":
          return isParticipationComplete() ? "active" : "inactive";
        case "wishlist":
          return isParticipationComplete() &&
            (!event.isLootjesEvent || isDrawnameComplete())
            ? "active"
            : "inactive";
        case "gift":
          return isParticipationComplete() &&
            (!event.isLootjesEvent || isDrawnameComplete()) &&
            isWishlistComplete() &&
            event.isInvited
            ? "active"
            : "inactive";
        default:
          return "inactive";
      }
    }
  };

  // Get progress text
  const getProgressText = (todo: Todo): string => {
    if (isOrganizer) {
      const totalParticipants = participantsArray.length;

      switch (todo.id) {
        case "participants":
          return `${confirmedParticipants.length}/${totalParticipants}`;
        case "drawname":
          return `${drawnNamesCount}/${totalParticipants}`;
        case "wishlist":
          return `${participantsWithWishlist.length}/${totalParticipants}`;
        case "gift":
          const purchasedGifts = participantsArray.filter((p) =>
            hasParticipantPurchasedForEvent(p.id, event.id, wishlists || {})
          );
          return `${purchasedGifts.length}/${totalParticipants}`;
        default:
          return "";
      }
    } else {
      return "";
    }
  };

  const formatDate = (dateString?: string) => {
  if (!dateString) return "Onbekende datum";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Onbekende datum";
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

  const handleCardClick = () => {
    router.push(`/dashboard/event/${event.id}`); // ✅ CORRECT!
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(event.id);
    }
    setIsAlertOpen(false);
  };

  return (
    <>
      <Card
        className="border border-gray-200 shadow hover:shadow-lg bg-white transition-all duration-200 cursor-pointer overflow-hidden pb-3"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-warm-olive text-3xl w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold text-accent">{event.name}</h2>
                <CardDescription className="text-gray-500">
                  Datum: {formatDate(event.startDateTime)}
                </CardDescription>
              </div>
            </div>

            {isOrganizer && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="text-gray-500 text-xl w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border border-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-[#b34c4c] hover:bg-gray-100"
                    onClick={handleDeleteClick}
                  >
                    Verwijder
                  </button>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-0">
          <p className="text-gray-500 mb-2 min-h-[24px]">
            {event.budget ? `Budget: €${event.budget}` : ""}
          </p>
          {event.startDateTime && (
  <CountdownTimer
    targetDate={event.startDateTime}
    isRed
  />
)}
          <div className="mt-4 border-t border-gray-100 pt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              To-do lijst:
            </h3>
            <div className="space-y-1">
              {sortedTodoList.map((todo, index) => {
                const status = getTodoStatus(todo, index);
                const progressText =
                  isOrganizer && status === "active"
                    ? getProgressText(todo)
                    : undefined;

                return (
                  <TodoItem
                    key={todo.id}
                    label={todo.label}
                    status={status}
                    statusText={isOrganizer ? todo.hoverText : undefined}
                    progressText={progressText}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Ben je zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan gemaakt worden. Dit zal dit evenement
              permanent verwijderen en uw gegevens van onze servers verwijderen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="hover:bg-gray-100 hover:text-accent text-accent border-none"
              onClick={(e) => e.stopPropagation()}
            >
              Annuleer
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#b34c4c] hover:bg-red-600 text-white border-none"
              onClick={handleDeleteConfirm}
            >
              Verwijder evenement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}