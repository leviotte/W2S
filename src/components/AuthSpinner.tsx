"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { HashLoader } from "react-spinners";

interface AuthSpinnerProps {
  children: React.ReactNode;
}

export default function AuthSpinner({ children }: AuthSpinnerProps) {
  // We halen de 'loading' state uit onze centrale store.
  // Dit is 'true' bij de initiële app-lading en tijdens async acties zoals login.
  // We gebruiken een selector voor performance-optimalisatie.
  const loading = useAuthStore((state) => state.loading);

  // Als de app laadt, tonen we een full-screen spinner.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <HashLoader color="#4d7c0f" loading={true} size={40} />
      </div>
    );
  }
  return <>{children}</>;
}