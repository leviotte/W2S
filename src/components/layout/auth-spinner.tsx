/**
 * src/components/layout/auth-spinner.tsx
 *
 * GOLD STANDARD VERSIE: Gekoppeld aan de Zustand store voor globale loading state.
 */
"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { HashLoader } from "react-spinners";

interface AuthSpinnerProps {
  children: React.ReactNode;
}

export function AuthSpinner({ children }: AuthSpinnerProps) {
  // VERBETERING: Haal de loading state en initialisatie-status rechtstreeks uit de store.
  // We gebruiken 'isInitialized' om te weten of de eerste authenticatie-check (bv. bij een page refresh) is afgerond.
  const { loading, isInitialized } = useAuthStore((state) => ({
    loading: state.loading,
    isInitialized: state.isInitialized,
  }));

  // Toon de spinner ALLEEN als we nog aan het laden zijn EN de store nog niet geïnitialiseerd is.
  // Dit voorkomt dat de spinner onnodig verschijnt bij andere laad-acties (zoals een wachtwoord wijzigen).
  if (loading && !isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* De kleur heb ik overgenomen, maar je kan hier een kleur uit je Tailwind config gebruiken indien gewenst */}
        <HashLoader color="#4d7c0f" loading size={50} />
      </div>
    );
  }

  // Zodra de state geïnitialiseerd is, tonen we de content.
  return <>{children}</>;
}