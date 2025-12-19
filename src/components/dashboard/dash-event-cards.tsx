// src/components/dashboard/dash-event-cards.tsx
"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  Lock,
  Globe,
  ListTodo,
  GalleryHorizontalEnd,
  PanelTopClose,
} from "lucide-react";
import { useRouter } from "next/navigation";

export type EventStats = {
  upcoming: number;
  past: number;
  onGoing: number;
  all: number;
};

export type WishlistStats = {
  total: number;
  public: number;
  private: number;
};

interface DashEventCardsProps {
  events: EventStats;
  wishlists?: WishlistStats;
}

export default function DashEventCards({ events, wishlists }: DashEventCardsProps) {
  const router = useRouter();

  const eventCard = {
    id: 1,
    label: "Mijn Events",
    onClick: () => router.push("/dashboard/events"),
  };

  const wishlistCard = {
    id: 2,
    label: "Mijn Wishlists",
    onClick: () => router.push("/dashboard/wishlists"),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2 sm:p-4">
      {/* EVENTS CARD - GEFORCEERD WIT! */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={eventCard.onClick}
        className="bg-white cursor-pointer shadow-md rounded-xl p-6 flex flex-col gap-4 transition-shadow duration-500 hover:shadow-lime-700 hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-green-900 mb-1">
          {eventCard.label}
        </h3>
        
        {/* HORIZONTALE LAYOUT */}
        <div className="flex flex-wrap items-center gap-4 text-gray-700">
          <div className="flex items-center gap-2">
            <GalleryHorizontalEnd className="w-5 h-5 text-blue-600" />
            <span className="text-sm">Alles</span>
            <span className="text-lg font-bold">{events.all}</span>
          </div>
          <div className="flex items-center gap-2">
            <PanelTopClose className="w-5 h-5 text-emerald-600" />
            <span className="text-sm">Aankomend</span>
            <span className="text-lg font-bold">{events.upcoming}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-600" />
            <span className="text-sm">Verleden</span>
            <span className="text-lg font-bold">{events.past}</span>
          </div>
        </div>
      </motion.div>

      {/* WISHLISTS CARD - GEFORCEERD WIT! */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={wishlistCard.onClick}
        className="bg-white cursor-pointer shadow-md rounded-xl p-6 flex flex-col gap-4 transition-shadow duration-500 hover:shadow-lime-700 hover:shadow-md"
      >
        <h3 className="text-lg font-semibold text-green-900 mb-1">
          {wishlistCard.label}
        </h3>
        
        {/* HORIZONTALE LAYOUT */}
        <div className="flex flex-wrap items-center gap-4 text-gray-700">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" />
            <span className="text-sm">Totaal</span>
            <span className="text-lg font-bold">{wishlists?.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span className="text-sm">Openbaar</span>
            <span className="text-lg font-bold">{wishlists?.public || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <span className="text-sm">Privé</span>
            <span className="text-lg font-bold">{wishlists?.private || 0}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}