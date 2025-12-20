// src/hooks/useActiveProfile.ts
"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "activeProfile";

export function useActiveProfile(defaultUserId: string) {
  const [activeProfileId, setActiveProfileId] = useState<string>("main-account");
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ Load from localStorage (CLIENT ONLY!)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== "main-account") {
      setActiveProfileId(saved);
    } else {
      setActiveProfileId("main-account");
    }
    setIsHydrated(true);
  }, []);

  // ✅ Save to localStorage when changed
  const setActiveProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    localStorage.setItem(STORAGE_KEY, profileId);
  };

  // ✅ Get current user ID (main account or sub-profile)
  const getCurrentUserId = () => {
    return activeProfileId === "main-account" ? defaultUserId : activeProfileId;
  };

  return {
    activeProfileId,
    setActiveProfile,
    getCurrentUserId,
    isHydrated,
  };
}