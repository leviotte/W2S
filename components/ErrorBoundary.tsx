"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);
  const pathname = usePathname();

  // Reset error automatically when user navigates
  useEffect(() => {
    if (error) setError(null);
  }, [pathname]);

  const handleError = (err: Error) => {
    console.error("Captured error:", err);
    setError(err);
  };

  // React’s functional error boundary pattern
  return (
    <React.ErrorBoundary fallbackRender={() => (
      fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-[#b34c4c] mb-1">
            Er ging iets mis
          </h2>
          <p className="text-sm text-[#b34c4c]">
            Herlaad de pagina of neem contact op als dit blijft voorkomen.
          </p>
        </div>
      )
    )} onError={handleError}>
      {children}
    </React.ErrorBoundary>
  );
}
