// src/components/ErrorBoundary.tsx
"use client";

import React from 'react';
// DE FIX: Importeren uit de library, niet uit React zelf.
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p>Oeps, er is iets misgegaan:</p>
      <pre className="text-sm my-2 p-2 bg-red-50 rounded">{error.message}</pre>
      <Button onClick={resetErrorBoundary} variant="destructive">
        Probeer opnieuw
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // bijvoorbeeld: reset de state van de app of laad de pagina opnieuw
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}