"use client";

import { useEffect, PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop({ children }: PropsWithChildren) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return <>{children}</>;
}
