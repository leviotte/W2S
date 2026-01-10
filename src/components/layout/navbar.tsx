// src/components/layout/navbar.tsx
import Link from "next/link";
import { Home, Search } from "lucide-react";
import { TeamSwitcher } from "@/app/profile/_components/TeamSwitcher";
import { NavbarClient } from "./navbar.client";
import type { UserProfile } from "@/types/user";

interface NavbarProps {
  serverUser: UserProfile | null;
}

export function Navbar({ serverUser }: NavbarProps) {
  const menuItems = serverUser
    ? [
        { label: "Dashboard", path: "/dashboard", icon: Home },
        ...(serverUser.isAdmin
          ? [{ label: "Admin", path: "/admin", icon: Home }]
          : []),
        { label: "Zoek vrienden", path: "/search", icon: Search },
      ]
    : [];

  return (
    <nav className="bg-gray-100 shadow-sm">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/wish2share.png"
              alt="Wish2Share Logo"
              className="h-16 md:h-24 pb-2"
            />
            <span className="ml-0 text-3xl font-bold text-chart-5">
              Wish2Share
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <item.icon className="h-5 w-5 mr-1" />
                {item.label}
              </Link>
            ))}

            {serverUser ? (
  <TeamSwitcher serverUser={serverUser} />
) : (
  <NavbarClient />
)}
          </div>

          {/* Mobile toggle */}
          <NavbarClient mobile menuItems={menuItems} />
        </div>
      </div>
    </nav>
  );
}
