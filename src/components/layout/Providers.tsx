// components/layout/Providers.tsx
"use client";

import { AuthProvider } from "@/src/components/AuthContext";
import AuthSpinner from "@/src/components/AuthSpinner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSpinner>{children}</AuthSpinner>
    </AuthProvider>
  );
}
