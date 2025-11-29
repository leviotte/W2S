// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import Providers from "../components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BackgroundPattern from "@/components/layout/BackgroundPattern";
import BackgroundTheme from "@/components/layout/BackgroundTheme";
import CookiesConsent from "@/components/layout/CookiesConsent";
import ScrollRestoration from "@/components/layout/ScrollRestoration";

export const metadata: Metadata = {
  title: "Wish2Share",
  description: "Share wishes, manage events and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <BackgroundPattern>
            <BackgroundTheme>
              <ScrollRestoration>
                <Navbar />
                <main className="min-h-[91vh]">{children}</main>
                <CookiesConsent />
                <Footer />
              </ScrollRestoration>
            </BackgroundTheme>
          </BackgroundPattern>
        </Providers>
      </body>
    </html>
  );
}
