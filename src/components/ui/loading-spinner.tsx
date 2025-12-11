/**
 * src/components/ui/loading-spinner.tsx
 *
 * GOLD STANDARD: Herbruikbaar loading component met optionele text support.
 */
"use client";

import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string; // NIEUW: Optionele tekst onder de spinner
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  // Als er text is, tonen we een flex container
  if (text) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <Loader className={cn("animate-spin text-primary", sizeClasses[size])} />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  // Zonder text, gewoon de spinner
  return (
    <Loader
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}