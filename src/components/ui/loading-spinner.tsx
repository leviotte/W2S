/**
 * src/components/ui/loading-spinner.tsx
 *
 * GOLD STANDARD: Perfect, herbruikbaar UI-component voor diverse laadstatussen.
 */
"use client";

import { cn } from "@/lib/utils"; // <-- BEST PRACTICE: Gebruik 'cn' voor classnames!
import { Loader } from "lucide-react"; // <-- BEST PRACTICE: Gebruik een icoon uit je bibliotheek!

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <Loader
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}