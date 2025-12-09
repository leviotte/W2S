// src/components/dashboard/dash-event-cards.tsx
"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Lock, Globe, ListTodo, GalleryHorizontalEnd, PanelTopClose, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Exporteer dit type zodat de wrapper het kan gebruiken
export type EventStats = {
  onGoing: number;
  all: number;
  past: number;
};

// We voegen WishlistStats hier ook toe voor consistentie
import type { WishlistStats } from "@/lib/data/wishlists";

interface Props {
  organizedEvents: EventStats;
  wishlists: WishlistStats;
}

type CardStat = {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  label: string;
  value: number;
  color: string;
};

export default function DashEventCards({ organizedEvents, wishlists }: Props) {
  const router = useRouter();

  const cards = [
    {
      id: 1,
      label: "Mijn Events",
      // DE FIX: onClick is een property, geen spread
      onClick: () => router.push("/dashboard/upcoming"),
      stats: [
        { icon: GalleryHorizontalEnd, label: "Totaal", value: organizedEvents.all, color: "text-blue-600 dark:text-blue-400" },
        { icon: PanelTopClose, label: "Aankomend", value: organizedEvents.onGoing, color: "text-emerald-600 dark:text-emerald-400" },
        { icon: CalendarCheck, label: "Verleden", value: organizedEvents.past, color: "text-amber-600 dark:text-amber-400" },
      ] as CardStat[],
    },
    {
      id: 2,
      label: "Mijn Wishlists",
      // DE FIX: onClick is een property, geen spread
      onClick: () => router.push("/dashboard/wishlists"),
      stats: [
        { icon: ListTodo, label: "Totaal", value: wishlists?.total || 0, color: "text-blue-600 dark:text-blue-400" },
        { icon: Globe, label: "Openbaar", value: wishlists?.public || 0, color: "text-green-600 dark:text-green-400" },
        { icon: Lock, label: "Privé", value: wishlists?.private || 0, color: "text-amber-600 dark:text-amber-400" },
      ] as CardStat[],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2 sm:p-4">
      {cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          // DE FIX: Correcte onClick syntax
          onClick={card.onClick}
          className="bg-card dark:bg-green-900/20 cursor-pointer shadow-md rounded-xl p-6 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-lg hover:shadow-lime-700/50"
        >
          <h3 className="text-lg font-semibold text-card-foreground dark:text-white mb-1">{card.label}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground dark:text-gray-300">
            {card.stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm">{stat.label}</span>
                <span className="text-lg font-bold text-card-foreground dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}