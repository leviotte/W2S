'use client';

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth"; // We maken deze hook/provider hierna

// In de toekomst kunnen hier meer providers komen (bv. voor data-fetching, state management, etc.)
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // attribute="class" is de standaard voor tailwindcss
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}