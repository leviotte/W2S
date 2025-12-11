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

// --- DE FIX: Type definitie gesynchroniseerd met de server component ---
// We exporteren dit zodat DashboardInfoPage en DashboardClientWrapper het kunnen importeren.
export type EventStats = {
    upcoming: number;
    past: number;
    onGoing: number; // We behouden deze voor toekomstig gebruik
    all: number;
};

// We definiëren WishlistStats hier ook voor de duidelijkheid.
// Dit type moet overeenkomen met wat getWishlistStatsForUser teruggeeft.
export type WishlistStats = {
    total: number;
    public: number;
    private: number;
};

interface DashEventCardsProps {
    events: EventStats;
    wishlists: WishlistStats;
}

// Een interne type voor de kaart-statistieken
type CardStat = {
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    label: string;
    value: number;
    color: string;
};

// Een herbruikbare component voor een enkele statistiek-kaart
function StatCard({ title, href, stats }: { title: string; href: string; stats: CardStat[] }) {
    return (
        <Link href={href} legacyBehavior>
            <a className="block group">
                <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-lime-700/40 group-hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-card-foreground">
                            {title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                                <span className="flex-1">{stat.label}</span>
                                <span className="text-base font-bold text-card-foreground">{stat.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </a>
        </Link>
    );
}

export default function DashEventCards({ events, wishlists }: DashEventCardsProps) {
    const eventCardStats: CardStat[] = [
        { icon: GalleryHorizontalEnd, label: "Totaal", value: events.all, color: "text-blue-500" },
        // --- DE FIX: Gebruik van `events.upcoming` ---
        { icon: PanelTopClose, label: "Aankomend", value: events.upcoming, color: "text-emerald-500" },
        { icon: CalendarCheck, label: "Verleden", value: events.past, color: "text-amber-500" },
    ];

    const wishlistCardStats: CardStat[] = [
        { icon: ListTodo, label: "Totaal", value: wishlists?.total || 0, color: "text-blue-500" },
        { icon: Globe, label: "Openbaar", value: wishlists?.public || 0, color: "text-green-500" },
        { icon: Lock, label: "Privé", value: wishlists?.private || 0, color: "text-red-500" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard 
                title="Mijn Events" 
                href="/dashboard/events/upcoming" // Link naar de specifieke pagina
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