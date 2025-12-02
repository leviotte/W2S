// app/layout.tsx
import type { Metadata } from "next";
import '../styles/globals.css';

import Providers from "../components/layout/Providers";
import Navbar from "@/src/components/navigation/Navbar";
import Footer from "@/src/components/Footer";
import BackgroundPattern from "@/src/components/background/BackgroundPattern";
import BackgroundTheme from "@/src/components/background/BackgroundTheme";
import CookiesConsent from "@/src/components/CookieConsent";
import ScrollRestoration from "@/src/components/layout/ScrollRestoration";

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
