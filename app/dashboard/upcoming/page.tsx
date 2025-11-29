"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import { useStore } from "@/store/useStore";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { MdEvent, MdMoreVert, MdCheck, MdClose } from "react-icons/md";
import { Circle, UserPlus, AlertCircle, ListChecks, GiftIcon, PartyPopper } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  confirmed: boolean;
  wishlistId?: string;
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

const TodoItem = ({ label, status, statusText, progressText }: { label: string; status: "inactive" | "active" | "complete"; statusText?: string; progressText?: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "complete":
        return { bgColor: "bg-warm-olive", textColor: "text-warm-olive", icon: <MdCheck className="text-white text-sm" /> };
      case "active":
        return { bgColor: "bg-warm-olive", textColor: "text-olive-600", icon: <Circle className="text-white w-4 h-4" strokeWidth={2} /> };
      default:
        return { bgColor: "bg-[#d3d3d3]", textColor: "text-[#b6b4b4]", icon: <MdClose className="text-white text-sm" /> };
    }
  };

  const { bgColor, textColor, icon } = getStatusStyles();
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className={`rounded-full p-1 ${bgColor}`}>{icon}</div>
        <span className={`text-sm ${textColor}`}>{statusText || label}</span>
      </div>
      {progressText && <span className="text-xs text-gray-500 ml-2 text-right">{progressText}</span>}
    </div>
  );
};

const EventCard = ({ event, onDelete }: any) => {
  const router = useRouter();
  const { currentUser } = useStore();
  const profile = localStorage.getItem("activeProfile");
  const currentUserId = profile === "main-account" ? currentUser?.id : profile;
  const isOrganizer = currentUser && event?.organizer === currentUserId;
  const [wishlists, setWishlists] = useState<Record<string, any>>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const participantsArray: Participant[] = Array.isArray(event?.participants) ? event?.participants : Object.values(event?.participants || []);
  const confirmedParticipants = participantsArray.filter((p) => p.confirmed);
  const drawnNamesCount = event?.drawnNames ? Object.keys(event.drawnNames).length : 0;
  const participantsWithWishlist = participantsArray.filter((p) => p.wishlistId);

  useEffect(() => {
    const wishlistIds = participantsArray.filter((p) => p.wishlistId).map((p) => p.wishlistId as string);
    if (wishlistIds.length === 0) return;

    const unsubscribers = wishlistIds.map((id) => {
      const ref = doc(db, "wishlists", id);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) setWishlists((prev) => ({ ...prev, [id]: snap.data() }));
      });
    });

    return () => unsubscribers.forEach((u) => u());
  }, [event]);

  const getHoverText = (stepId: string) => {
    const total = participantsArray.length;
    switch (stepId) {
      case "participants": return `${confirmedParticipants.length} van ${total} deelnemers geregistreerd`;
      case "drawname": return `${drawnNamesCount} van ${total} namen getrokken`;
      case "wishlist": return `${participantsWithWishlist.length} van ${total} verlanglijstjes toegevoegd`;
      case "gift": {
        const purchased = participantsArray.filter((p) => Object.values(wishlists || {}).some(w => w.items.some((i: any) => i.purchasedBy?.[event?.id]?.includes(p.id))));
        return `${purchased.length} van ${total} cadeaus gekocht`;
      }
      case "surprise": return event?.eventComplete ? "Evenement afgerond!" : "Laat het feest beginnen.";
      default: return "";
    }
  };

  const todoList: Todo[] = [
    { id: "participants", label: "Registratie deelnemers", icon: <UserPlus className="w-4 h-4" />, computeStatus: () => participantsArray.every((i) => i.confirmed), hoverText: getHoverText("participants"), visible: true, order: 1 },
    { id: "drawname", label: "Trek een naam", icon: <AlertCircle className="w-4 h-4" />, computeStatus: () => drawnNamesCount === participantsArray.length, hoverText: getHoverText("drawname"), visible: !!event?.isLootjesEvent, order: 2 },
    { id: "wishlist", label: "Koppel wishlist", icon: <ListChecks className="w-4 h-4" />, computeStatus: () => participantsWithWishlist.length === participantsArray.length, hoverText: getHoverText("wishlist"), visible: true, order: 3 },
    { id: "gift", label: "Koop een cadeau", icon: <GiftIcon className="w-4 h-4" />, computeStatus: () => participantsArray.every(p => Object.values(wishlists || {}).some(w => w.items.some((i: any) => i.purchasedBy?.[event?.id]?.includes(p.id)))), hoverText: getHoverText("gift"), visible: true, order: 4 },
    { id: "surprise", label: "Laat je verrassen!", icon: <PartyPopper className="w-4 h-4" />, computeStatus: () => Boolean(event?.eventComplete), hoverText: getHoverText("surprise"), visible: true, order: 5 },
  ].filter(t => t.visible).sort((a, b) => a.order - b.order);

  const handleCardClick = () => router.push(`/dashboard/event/${event?.id}?tab=events&subTab=details`);
  const handleDeleteConfirm = (e: any) => { e.stopPropagation(); onDelete(event?.id); setIsAlertOpen(false); };

  const formatDate = (date: string) => {
    const d = new Date(date); return isNaN(d.getTime()) ? "Invalid date" : new Intl.DateTimeFormat("en-GB").format(d);
  };

  return (
    <>
      <Card onClick={handleCardClick} className="border shadow hover:shadow-lg cursor-pointer pb-3">
        <CardHeader className="pb-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MdEvent className="text-warm-olive text-3xl" />
            <div>
              <h2 className="text-xl font-bold text-accent">{event?.name}</h2>
              <CardDescription className="text-gray-500">Datum: {formatDate(event?.date)}</CardDescription>
            </div>
          </div>
          {isOrganizer && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-100"><MdMoreVert className="text-gray-500 text-xl" /></button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-black">
                <button className="w-full text-left px-4 py-2 text-[#b34c4c] hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setIsAlertOpen(true); }}>Verwijder</button>
              </PopoverContent>
            </Popover>
          )}
        </CardHeader>
        <CardContent>
          {event?.budget && <p className="text-gray-500 mb-2">Budget: €{event.budget}</p>}
          {event?.date && <CountdownTimer targetDate={event.date} targetTime={event?.time || "00:00"} />}
          <div className="mt-4 border-t pt-3">
            {todoList.map((todo, idx) => {
              const status = todo.computeStatus() ? "complete" : "active";
              return <TodoItem key={todo.id} label={todo.label} status={status} statusText={todo.hoverText} />;
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ben je zeker?</AlertDialogTitle>
            <AlertDialogDescription>Deze actie kan niet ongedaan gemaakt worden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleer</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-[#b34c4c] hover:bg-red-600 text-white">Verwijder evenement</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function UpcomingEventsPage() {
  const { events, loadEvents, deleteEvent } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents().finally(() => setLoading(false)); }, [loadEvents]);

  const handleDelete = (id: string) => deleteEvent(id);

  const isPastEvent = (event: any) => new Date(event.date + "T" + (event.time || "00:00")) <= new Date();
  const isUpcomingEvent = (event: any) => !isPastEvent(event);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-accent">Aankomende evenementen</h1>
        <button className="bg-warm-olive text-white px-4 py-2 rounded-md hover:bg-cool-olive" onClick={() => router.push("/dashboard?tab=events&subTab=create")}>Nieuw Evenement</button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {events.filter(isUpcomingEvent).map((event) => <EventCard key={event.id} event={event} onDelete={handleDelete} />)}
      </div>

      <h1 className="text-2xl font-bold text-accent my-6">Afgelopen evenementen</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {events.filter(isPastEvent).map((event) => <EventCard key={event.id} event={event} onDelete={handleDelete} />)}
      </div>
    </div>
  );
}
