// src/components/layout/navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { TeamSwitcher } from "@/app/profile/_components/TeamSwitcher";

export function Navbar() {
  // ✅ Zustand auth store
  const currentUser = useAuthStore((state) => state.currentUser);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = currentUser
    ? [
        { label: "Dashboard", path: "/dashboard", icon: Home },
        ...(currentUser.isAdmin
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
              className="h-16 md:h-24 pb-2 pl-0"
            />
            <span className="ml-0 text-3xl font-bold text-chart-5">
              Wish2Share
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {item.icon && <item.icon className="h-5 w-5 mr-1" />}
                {item.label}
              </Link>
            ))}

            {/* ✅ TeamSwitcher (Profile Dropdown) */}
            {currentUser && <TeamSwitcher />}

            {/* ✅ Login/Register Buttons */}
            {!currentUser && (
              <>
                <Button
                  onClick={openLoginModal}
                  className="bg-warm-olive text-white hover:bg-cool-olive"
                >
                  Log In
                </Button>
                <Button
                  onClick={openRegisterModal}
                  variant="outline"
                  className="border-warm-olive text-warm-olive"
                >
                  Registreer
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                  {item.label}
                </div>
              </Link>
            ))}

            {!currentUser && (
              <div className="flex flex-col gap-2 px-3 pt-2">
                <Button
                  onClick={() => {
                    openLoginModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-warm-olive text-white hover:bg-cool-olive"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    openRegisterModal();
                    setIsMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-warm-olive text-warm-olive"
                >
                  Registreer
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}