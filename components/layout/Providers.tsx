// components/layout/Providers.tsx
"use client";

import { AuthProvider } from "@/components/AuthContext";
import AuthSpinner from "@/components/AuthSpinner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSpinner>{children}</AuthSpinner>
    </AuthProvider>
  );
}
