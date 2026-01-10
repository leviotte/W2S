// src/components/layout/navbar.client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarClientProps {
  mobile?: boolean;
  menuItems?: { label: string; path: string }[];
}

export function NavbarClient({ mobile, menuItems = [] }: NavbarClientProps) {
  const [open, setOpen] = useState(false);

  if (!mobile) {
    return (
      <>
        <Button asChild className="bg-warm-olive text-white">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Registreer</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2">
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <div className="px-4 py-2 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setOpen(false)}
              className="block"
            >
              {item.label}
            </Link>
          ))}

          <Button asChild className="w-full">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Registreer</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
