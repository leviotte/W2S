// src/components/shared/store-initializer.tsx
"use client";

import { useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import type { SessionUser } from "@/types/user";

interface StoreInitializerProps {
  user: SessionUser | null;
}

function StoreInitializer({ user }: StoreInitializerProps) {
  const initialized = useRef(false);

  // We gebruiken useEffect om te synchroniseren na de eerste render.
  useEffect(() => {
    // De check op 'initialized' is niet strikt nodig met een correcte dependency array,
    // maar het is een goede gewoonte om te voorkomen dat de actie onnodig opnieuw wordt uitgevoerd.
    if (!initialized.current) {
      useAuthStore.getState().setCurrentUser(user);
      initialized.current = true;
    }
  }, [user]);

  // Dit component rendert zelf niets
  return null;
}

export default StoreInitializer;