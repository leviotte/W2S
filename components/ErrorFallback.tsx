"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
  error: Error;
}

export default function ErrorFallback({ error }: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-[#b34c4c] mb-4">
          Er ging iets mis
        </h2>

        <p className="text-gray-600 mb-6">
          {error?.message || "Er is een onverwachte fout opgetreden."}
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Herlaad pagina
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive transition"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
