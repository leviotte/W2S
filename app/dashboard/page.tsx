"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

// Dashboard componenten
import ProfilePage from "@/components/ProfilePage";
import AddProfilePage from "@/components/AddProfilePage";
import Blog from "@/components/Blog";
import UpcomingEventsPage from "@/components/UpcomingEventsPage";
import PastEventsPage from "@/components/PastEventsPage";
import CreateEventPage from "@/components/CreateEventPage";
import EventPage from "@/components/EventPage";
import EventInvitesPage from "@/components/EventInvitesPage";
import EventReminderPage from "@/components/EventReminderPage";
import RequestPage from "@/components/WishlistRequestPage";
import CreateWishlistPage from "@/components/CreateWishlistPage";
import WishlistsPage from "@/components/WishlistsPage";
import WishlistDetailPage from "@/components/WishlistDetailPage";
import WishlistEventPage from "@/components/WishlistFromEvent";
import UserProfilePage from "@/components/UserProfilePage";
import DashboardInfo from "@/components/DashboardInfo";
import FollowersFollowingList from "@/components/FollowersFollowingList";

// Wrapper component voor SSR + SEO
import BackgroundPattern from "@/components/BackgroundPattern";
import BackgroundTheme from "@/components/BackgroundTheme";

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
          {tab === "event" && subTab === "invites" && <EventInvitesPage />}
          {tab === "event" && subTab === "reminder" && <EventReminderPage />}
          {tab === "event" && subTab === "request" && <RequestPage />}
          {tab === "wishlists" && subTab === "create" && <CreateWishlistPage />}
          {tab === "wishlists" && subTab === "list" && <WishlistsPage />}
          {tab === "wishlists" && subTab === "details" && <WishlistDetailPage />}
          {tab === "wishlists" && subTab === "event-details" && <WishlistEventPage />}
          {tab === "users" && subTab === "profile" && <UserProfilePage />}
          {(tab === "dashboard" || (tab === "" && subTab === "")) && <DashboardInfo />}
          {tab === "user" && (subTab === "followers" || subTab === "following") && (
            <FollowersFollowingList />
          )}
        </main>
      </BackgroundPattern>
    </BackgroundTheme>
  );
}
