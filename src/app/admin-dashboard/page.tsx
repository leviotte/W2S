'use client';

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// MENTOR NOTE: We importeren deze nu, maar we gaan ze anders moeten aanroepen of herstructureren.
// import UserProfilePage from "../profile/[username]/page";
import AddAccountPage from "../add-account/page";
import Metrics from "@/components/landing/Metrics";
import WebBackGrounds from "../dashboard/web-backgrounds/page";
import AffiliateStoresPage from "../dashboard/affiliate-stores/page";
import BlogPage from "../blog/page";
import InquiriesPage from "../dashboard/inquiries/page";
import { useSearchParams, useRouter } from "next/navigation";

// MENTOR NOTE: De PageProps voor UserProfilePage verwacht een `params` object.
// Voorbeeld: type PageProps = { params: { username: string } };
// We moeten dit voorzien wanneer we de component aanroepen.
type PageProps = { params: { username: string } };


export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [subTab, setSubTab] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab") || "metrics";
    const subTabParam = searchParams.get("subTab") || "";
    setTab(tabParam);
    setSubTab(subTabParam);

    // Forceer een re-check van de pijlen wanneer de tabs veranderen
    setTimeout(() => handleScroll(), 100);

  }, [searchParams]);

  const handleScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 0);
    // Voeg een kleine marge toe om afrondingsfouten te voorkomen
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
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
    const tabsElement = tabsRef.current;
    if (tabsElement) {
        // Initial check
        handleScroll();
        // Event listener voor scroll
        tabsElement.addEventListener("scroll", handleScroll);
        // ResizeObserver voor als de viewport of componentgrootte verandert
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(tabsElement);
    
        return () => {
          if (tabsElement) {
            tabsElement.removeEventListener("scroll", handleScroll);
          }
          resizeObserver.disconnect();
        };
    }
  }, [tabsRef]);


  const goToTab = (tabName: string, subTabName?: string) => {
    const params = new URLSearchParams();
    params.set("tab", tabName);
    if (subTabName) {
      params.set("subTab", subTabName);
    }
    router.push(`/admin-dashboard?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="relative">
          <button
            onClick={() => scrollTabs("left")}
            className={`absolute left-[-10px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 flex items-center justify-center transition-opacity ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll links"
          >
            <ChevronLeft className="h-5 w-5 text-accent" />
          </button>

          <div ref={tabsRef} className="overflow-x-auto hide-scrollbar relative">
            <div className="flex min-w-max space-x-4 border-b border-gray-200 px-6">
              <button onClick={() => goToTab("metrics")} className={`px-4 py-2 whitespace-nowrap ${tab === "metrics" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Metrics</button>
              <button onClick={() => goToTab("backgrounds", "web")} className={`px-4 py-2 whitespace-nowrap ${tab === "backgrounds" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Backgrounds</button>
              <button onClick={() => goToTab("settings", "affiliate-stores")} className={`px-4 py-2 whitespace-nowrap ${tab === "settings" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Settings</button>
              <button onClick={() => goToTab("blogs")} className={`px-4 py-2 whitespace-nowrap ${tab === "blogs" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Blog</button>
              <button onClick={() => goToTab("accounts")} className={`px-4 py-2 whitespace-nowrap ${tab === "accounts" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Manage Social Accounts</button>
              <button onClick={() => goToTab("inquiries")} className={`px-4 py-2 whitespace-nowrap ${tab === "inquiries" ? "text-accent border-b-2 border-accent" : "text-gray-500"}`}>Inquiries</button>
            </div>
          </div>

          <button
            onClick={() => scrollTabs("right")}
            className={`absolute right-[-10px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 flex items-center justify-center transition-opacity ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-label="Scroll rechts"
          >
            <ChevronRight className="h-5 w-5 text-accent" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {tab === "backgrounds" && <WebBackGrounds />}
          {tab === "settings" && subTab === "affiliate-stores" && <AffiliateStoresPage />}
          {tab === "blogs" && <BlogPage />}
          {tab === "inquiries" && <InquiriesPage />}
          {tab === "accounts" && <AddAccountPage />}
          {tab === "metrics" && <Metrics />}
        </div>
      </div>
    </div>
  );
}