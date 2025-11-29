// app/components/Hero.tsx
"use client";

import { useState, useEffect } from "react";
import { Gift, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "../store/useStore";
import { useAuth } from "./AuthContext";

const titles = [
  { text: "Trek Lootjes", id: 1 },
  { text: "Organiseer Events", id: 2 },
  { text: "Maak WishLists", id: 3 },
  { text: "Volg Vrienden", id: 4 },
];

export default function Hero() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const router = useRouter();
  const { currentUser } = useStore();
  const { showLoginModal } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateWishlist = () => {
    if (!currentUser) {
      showLoginModal();
      return;
    }
    router.push("/dashboard?tab=wishlists&subTab=create");
  };

  const handleCreateEvent = () => {
    if (!currentUser) {
      showLoginModal();
      return;
    }
    router.push("/dashboard?tab=events&subTab=create");
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/pattern-bg.svg')`,
          backgroundSize: "cover",
          backgroundPosition: "top center",
          opacity: 0.2,
          transform: "scaleY(0.7)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <div className="h-[4.5rem] sm:h-[3.5rem] md:h-[4.5rem] relative overflow-hidden">
              {titles.map((title, index) => {
                const isActive = index === currentTitleIndex;
                return (
                  <span
                    key={title.id}
                    className={`absolute w-full left-0 transition-all duration-500 ${
                      isActive ? "top-0 opacity-100" : "-top-full opacity-0"
                    }`}
                  >
                    <span
                      className={`block ${
                        index === 1 || index === 3
                          ? "text-warm-olive"
                          : "text-cool-olive"
                      }`}
                    >
                      {title.text}
                    </span>
                  </span>
                );
              })}
            </div>
          </h1>

          <p className="mt-1 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            De perfecte site om evenementen te organiseren, cadeaus uit te wisselen
            en wishlists te maken. Maak cadeaus geven leuk en gemakkelijk!
          </p>

          <div className="mt-5 max-w-md mx-auto flex flex-row sm:flex-row md:flex-row gap-5 items-center justify-center md:mt-6 sm:space-y-0">
            {/* Maak Event */}
            <div className="w-full sm:w-[48%] md:w-[48%]">
              <button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive w-full h-32 flex flex-col items-center justify-center px-2 min-w-32 sm:px-6 border-4 border-transparent text-base font-medium rounded-md text-white transition-all duration-300 overflow-hidden z-10 hover:scale-105 hover:shadow-[0_4px_12px_rgba(72,97,64,0.3)] hover:bg-gradient-to-r hover:from-cool-olive hover:via-warm-olive hover:to-cool-olive"
              >
                <Users className="h-8 w-8 mb-3" />
                <span className="text-md sm:text-lg px-2">Maak een Event</span>
                <span className="text-xs sm:text-sm opacity-80">
                  (Met of zonder lootjes)
                </span>
              </button>
            </div>

            {/* Maak Wishlist */}
            <div className="w-full sm:w-[48%] md:w-[48%]">
              <button
                onClick={handleCreateWishlist}
                className="bg-gradient-to-r from-warm-olive via-cool-olive to-warm-olive w-full h-32 flex flex-col items-center justify-center px-2 min-w-32 sm:px-6 border-4 border-transparent text-base font-medium rounded-md text-white transition-all duration-300 overflow-hidden hover:scale-105 hover:shadow-[0_4px_12px_rgba(72,97,64,0.3)] hover:bg-gradient-to-r hover:from-cool-olive hover:via-warm-olive hover:to-cool-olive"
              >
                <Gift className="h-8 w-8 mb-3" />
                <span className="text-md sm:text-lg">Maak een Wishlist</span>
                <span className="text-xs sm:text-sm opacity-80">
                  (Voor jezelf of anderen)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
