// components/layout/ScrollRestoration.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestoration({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return <>{children}</>;
}
