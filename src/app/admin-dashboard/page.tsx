'use client';

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProfilePage from 
import AddAccountPage from "../add-account/page";
import Metrics from "@/components/Metrics";
import WebBackGrounds from "../dashboard/WebBackGrounds/page";
import AffiliateStoresPage from "../dashboard/affiliate-stores/page";
import BlogPage from "../blog/page";
import InquiriesPage from "../dashboard/inquiries/page";
import { useSearchParams, useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [subTab, setSubTab] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab") || "";
    const subTabParam = searchParams.get("subTab") || "";
    setTab(tabParam);
    setSubTab(subTabParam);
  }, [searchParams]);

  const handleScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsRef.current) return;
    const scrollAmount = 200;
    tabsRef.current.scrollTo({
      left: direction === "left" ? tabsRef.current.scrollLeft - scrollAmount : tabsRef.current.scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  const goToTab = (tabName: string, subTabName?: string) => {
    router.push(`/admin-dashboard?tab=${tabName}${subTabName ? `&subTab=${subTabName}` : ""}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="relative">
          <button
            onClick={() => scrollTabs("left")}
            className={`absolute left-[-10px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 flex items-center justify-center transition-opacity ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronLeft className="h-5 w-5 text-accent" />
          </button>

          <div ref={tabsRef} onScroll={handleScroll} className="overflow-x-auto hide-scrollbar relative">
            <div className="flex min-w-max space-x-4 border-b border-gray-200 px-6">
              <button onClick={() => goToTab("metrics")} className={`px-4 py-2 whitespace-nowrap ${tab === "metrics" || (!tab && !subTab) ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Metrics</button>
              <button onClick={() => goToTab("beckgrounds", "web")} className={`px-4 py-2 whitespace-nowrap ${tab === "beckgrounds" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Backgrounds</button>
              <button onClick={() => goToTab("settings", "affliate-stores")} className={`px-4 py-2 whitespace-nowrap ${tab === "settings" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Settings</button>
              <button onClick={() => goToTab("blogs")} className={`px-4 py-2 whitespace-nowrap ${tab === "blogs" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Blog</button>
              <button onClick={() => goToTab("accounts")} className={`px-4 py-2 whitespace-nowrap ${tab === "accounts" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Manage Social Accounts</button>
              <button onClick={() => goToTab("inquiries")} className={`px-4 py-2 whitespace-nowrap ${tab === "inquiries" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Inquiries</button>
            </div>
          </div>

          <button
            onClick={() => scrollTabs("right")}
            className={`absolute right-[-10px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 flex items-center justify-center transition-opacity ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <ChevronRight className="h-5 w-5 text-accent" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {tab === "profile" && <ProfilePage />}
          {tab === "beckgrounds" && <WebBackGrounds />}
          {tab === "settings" && subTab === "affliate-stores" && <AffiliateStoresPage />}
          {tab === "blogs" && <BlogPage />}
          {tab === "inquiries" && <InquiriesPage />}
          {tab === "accounts" && <AddAccountPage />}
          {(tab === "metrics" || (!tab && !subTab)) && <Metrics />}
        </div>
      </div>
    </div>
  );
}
