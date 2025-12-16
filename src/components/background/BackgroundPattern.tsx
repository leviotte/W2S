// src/components/background/BackgroundPattern.tsx
"use client";

import React from "react";

interface BackgroundPatternProps {
  className?: string;
  children: React.ReactNode;
}

export default function BackgroundPattern({ className = "", children }: BackgroundPatternProps) {
  return (
    <div
      className={`relative min-h-screen ${className}`}
      style={{
        backgroundImage: `url('/pattern-bg.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "#ffffff",
        transition: "background-position 0.3s ease-out",
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
