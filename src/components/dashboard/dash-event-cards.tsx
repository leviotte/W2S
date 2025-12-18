// src/components/dashboard/dash-event-cards.tsx
"use client";

import Link from "next/link";
import {
    CalendarCheck,
    GalleryHorizontalEnd,
    Globe,
    ListTodo,
    Lock,
    PanelTopClose,
    LucideProps
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    wishlists: WishlistStats;
}

type CardStat = {
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    label: string;
    value: number;
    color: string;
};

function StatCard({ title, href, stats }: { title: string; href: string; stats: CardStat[] }) {
    return (
        <Link 
            href={href}
            className="block group h-full"
        >
            <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-lime-700/40 group-hover:-translate-y-1 border border-gray-200">
                <CardHeader className="pb-3 border-b border-gray-100">
                    <CardTitle className="text-base font-semibold text-gray-900">
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {stats.map((stat) => (
                        <div 
                            key={stat.label} 
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                            <div className="flex items-center gap-3">
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                                <span className="text-sm text-gray-600">{stat.label}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </Link>
    );
}

export default function DashEventCards({ events, wishlists }: DashEventCardsProps) {
    const eventCardStats: CardStat[] = [
        { icon: GalleryHorizontalEnd, label: "Alles", value: events.all, color: "text-blue-500" },
        { icon: PanelTopClose, label: "Aankomend", value: events.upcoming, color: "text-emerald-500" },
        { icon: CalendarCheck, label: "Verleden", value: events.past, color: "text-amber-500" },
    ];

    const wishlistCardStats: CardStat[] = [
        { icon: ListTodo, label: "Totaal", value: wishlists?.total || 0, color: "text-blue-500" },
        { icon: Globe, label: "Openbaar", value: wishlists?.public || 0, color: "text-green-500" },
        { icon: Lock, label: "Privé", value: wishlists?.private || 0, color: "text-red-500" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard 
                title="Mijn Events" 
                href="/dashboard/events/upcoming"
                stats={eventCardStats} 
            />
            <StatCard 
                title="Mijn Wishlists" 
                href="/dashboard/wishlists" 
                stats={wishlistCardStats} 
            />
        </div>
    );
}