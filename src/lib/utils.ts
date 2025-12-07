// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// De bestaande, essentiële 'cn' functie. ZEKER LATEN STAAN.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Genereert initialen uit een volledige naam.
 * @param name De volledige naam (bv. "Levi Otte")
 * @returns De initialen (bv. "LO")
 */
export const getInitials = (name: string | null | undefined): string => {
  // Verzekert dat we niet crashen op null/undefined en filtert lege strings
  if (!name) return "";
  const names = name.trim().split(" ").filter(Boolean);
  
  if (names.length === 0) return "";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();

  // Pakt de eerste letter van het eerste en laatste woord
  return (
    (names[0].charAt(0) || "") +
    (names[names.length - 1].charAt(0) || "")
  ).toUpperCase();
};