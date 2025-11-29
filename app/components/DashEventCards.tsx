"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Lock, Globe, ListTodo, GalleryHorizontalEnd, PanelTopClose } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

interface Props {
  organizedEvents: { onGoing: number; all: number; past: number };
  wishlists?: {
    total: number;
    public: number;
    private: number;
  };
}

export default function DashEventCards({ organizedEvents, wishlists }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // voorkomt SSR hydration errors
  const { events: allEvents, loadEvents } = useStore();

  useEffect(() => {
    setMounted(true);
    loadEvents();
  }, []);

  if (!mounted) return null; // wacht tot mount voor CSR-only hooks

  const events = [
    {
      id: 1,
      label: "Mijn Events",
      onGoing: organizedEvents.onGoing,
      all: organizedEvents.all,
      past: organizedEvents.past,
      onClick: () => router.push("/dashboard?tab=events&subTab=upcoming"),
    },
    {
      id: 2,
      label: "Mijn Wishlists",
      onClick: () => router.push("/dashboard?tab=wishlists&subTab=list"),
      stats: [
        {
          icon: ListTodo,
          label: "Totaal",
          value: wishlists?.total || 0,
          color: "text-blue-600",
        },
        {
          icon: Globe,
          label: "Openbaar",
          value: wishlists?.public || 0,
          color: "text-green-600",
        },
        {
          icon: Lock,
          label: "Privé",
          value: wishlists?.private || 0,
          color: "text-amber-600",
        },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2 sm:p-4">
      {events.map((event) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-green-900 cursor-pointer shadow-md rounded-xl p-6 flex flex-col gap-4 transition-shadow duration-500 hover:shadow-lime-700 hover:shadow-md"
          onClick={event.onClick}
        >
          <h3 className="text-lg font-semibold text-green-900 dark:text-white mb-1">
            {event.label}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-gray-700 dark:text-gray-300">
            {event.label === "Mijn Wishlists" ? (
              <>
                {event.stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-sm">{stat.label}</span>
                    <span className="text-lg font-bold">{stat.value}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <GalleryHorizontalEnd className="w-5 h-5 text-blue-600 dark:text-gray-300" />
                  <span className="text-sm">Alles</span>
                  <span className="text-lg font-bold">{event.all}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PanelTopClose className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  <span className="text-sm">Aankomend</span>
                  <span className="text-lg font-bold">{event.onGoing}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  <span className="text-sm">Verleden</span>
                  <span className="text-lg font-bold">{event.past}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
