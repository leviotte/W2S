"use client"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combineert meerdere Tailwind CSS class strings met clsx en mergeert conflicten met tailwind-merge.
 * Gebruik cn() voor veilige en nette className compositie in Next.js 16 componenten.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
