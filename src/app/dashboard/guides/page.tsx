"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PenTool, Calendar, Gift, Heart, Ticket } from "lucide-react";

const userGuideSVG = "/user_guide.svg";
const DrawingGuidePage = dynamic(() => import("../../guides/drawing/page"));
const EventGuidePage = dynamic(() => import("../../guides/event/page"));
const SubscriptionGuidePage = dynamic(
  () => import("../../guides/subscription/page")
);
const WishlistGuidePage = dynamic(
  () => import("../../guides/wishlist/page")
);

export default function GuidesPage() {
  const [activeGuide, setActiveGuide] = useState<string>("");
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(true);
  const [isSecondPanelSticky, setIsSecondPanelSticky] = useState(false);

  const steps = [
    { label: "Drawing Guides", key: "Drawing", icon: <Ticket size={24} /> },
    { label: "Event Guides", key: "Event", icon: <Calendar size={24} /> },
    { label: "Subscriptions", key: "Subscription", icon: <Gift size={24} /> },
    { label: "Wishlist Guides", key: "Wishlist", icon: <Heart size={24} /> },
  ];

  const renderGuide = () => {
    switch (activeGuide) {
      case "Drawing":
        return <DrawingGuidePage />;
      case "Event":
        return <EventGuidePage />;
      case "Subscription":
        return <SubscriptionGuidePage />;
      case "Wishlist":
        return <WishlistGuidePage />;
      default:
        return (
          <div className="text-center text-gray-700 text-xl">
            Klik op een van de bovenstaande icoontjes om meer uitleg te krijgen
            over de werking van de website.
          </div>
        );
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const firstPanel = document.getElementById("firstPanel");
      const secondPanel = document.getElementById("secondPanel");

      if (firstPanel) {
        const rect = firstPanel.getBoundingClientRect();
        setIsFirstPanelVisible(rect.bottom > 0);
      }

      if (secondPanel) {
        const rect = secondPanel.getBoundingClientRect();
        setIsSecondPanelSticky(rect.top <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* First Panel */}
      <div
        id="firstPanel"
        className="flex flex-wrap items-center justify-center md:justify-between md:w-10/12 mx-auto mt-10 gap-4 p-6 rounded-lg"
      >
        <img
          src={userGuideSVG}
          alt="User Guide Illustration"
          className="w-full md:w-6/12 h-auto rounded-lg"
        />

        <div className="w-full md:w-5/12 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-bold text-cool-olive mb-4">
            Hoe werkt Wish2Share?
          </h2>
          <p className="text-gray-600">
            Selecteer een onderwerp uit onderstaande opties.
          </p>

          <div className="w-full mt-8 flex justify-center md:justify-start gap-8 items-center">
            {steps.map((step) => (
              <div
                key={step.key}
                className={`w-12 h-12 rounded-full flex justify-center items-center font-bold cursor-pointer shadow-lg shadow-warm-olive transition-all duration-300 ${
                  activeGuide === step.key
                    ? "bg-accent text-white scale-110"
                    : "bg-gray-300 text-gray-700 hover:bg-blue-100"
                }`}
                onClick={() => setActiveGuide(step.key)}
              >
                {step.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Panel */}
      <div
        id="secondPanel"
        className={`transition-all duration-300 ${
          isFirstPanelVisible ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${isSecondPanelSticky ? "sticky top-0 pt-8 pb-8 bg-white z-50" : ""}`}
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex justify-center gap-4 items-center">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex justify-center items-center font-bold cursor-pointer shadow-lg transition-all duration-300 ${
                    activeGuide === step.key
                      ? "bg-accent text-white scale-110"
                      : "bg-gray-300 text-gray-700 hover:bg-blue-100"
                  }`}
                  onClick={() => setActiveGuide(step.key)}
                >
                  {step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div className="h-full w-1 bg-gray-400 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="w-full -mt-14">{renderGuide()}</div>
    </div>
  );
}
