"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

// Dashboard componenten
import ProfilePage from "./profile/page";
import AddProfilePage from "./add-profile/page";
import BlogPage from "../blog/page";
import UpcomingEventsPage from "./upcoming/page";
import PastEventsPage from "./events/past/page";
import CreateEventPage from "./events/create/page";
import EventPage from "./event/[id]/page";
import EventInvitesPage from "./events/[id]/invites/page";
import EventReminderPage from "../event/reminder/[id]/page";
import WishlistRequestPage from "@/src/components/wishlist/WishlistRequestForm";
import CreateWishlistPage from "./wishlist/create/page";
import WishlistsPage from "./wishlists/page";
import WishlistDetailPage from "@/src/components/wishlist/WishlistDetailPage";
import WishlistEventPage from "@/src/components/wishlist/WishlistEventPage";
import UserProfilePage from "@/src/components/profile/UserProfilePage";
import DashboardInfo from "./info/page";
import FollowersFollowingList from "./profiles/[profileId]/followers-following/page";

// Wrapper component voor SSR + SEO
import BackgroundPattern from "@/src/components/background/BackgroundPattern";
import BackgroundTheme from "@/src/components/background/BackgroundTheme";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [tab, setTab] = useState("");
  const [subTab, setSubTab] = useState("");

  useEffect(() => {
    const tabFromURL = searchParams.get("tab") || "";
    const subTabFromURL = searchParams.get("subTab") || "";
    setTab(tabFromURL);
    setSubTab(subTabFromURL);
  }, [pathname, searchParams.toString()]);

  const isWishListPage = tab === "wishlists";

  return (
    <BackgroundTheme className="min-h-screen" isWishListPage={isWishListPage}>
      <BackgroundPattern>
        <main className="relative z-10">
          {tab === "profile" && <ProfilePage />}
          {tab === "add-profile" && <AddProfilePage />}
          {tab === "blogs" && <Blog />}
          {tab === "events" && subTab === "upcoming" && <UpcomingEventsPage />}
          {tab === "events" && subTab === "past" && <PastEventsPage />}
          {tab === "events" && subTab === "create" && <CreateEventPage />}
          {tab === "events" && subTab === "details" && <EventPage />}
          {tab === "event" && subTab === "invites" && <EventInvitesPage params={{
                      id: ""
                  }} />}
          {tab === "event" && subTab === "reminder" && <EventReminderPage />}
          {tab === "event" && subTab === "request" && <WishlistRequestPage />}
          {tab === "wishlists" && subTab === "create" && <CreateWishlistPage />}
          {tab === "wishlists" && subTab === "list" && <WishlistsPage />}
          {tab === "wishlists" && subTab === "details" && <WishlistDetailPage />}
          {tab === "wishlists" && subTab === "event-details" && <WishlistEventPage />}
          {tab === "users" && subTab === "profile" && <UserProfilePage />}
          {(tab === "dashboard" || (tab === "" && subTab === "")) && <DashboardInfo />}
          {tab === "user" && (subTab === "followers" || subTab === "following") && (
            <FollowersFollowingList params={{
                          profileId: ""
                      }} />
          )}
        </main>
      </BackgroundPattern>
    </BackgroundTheme>
  );
}
