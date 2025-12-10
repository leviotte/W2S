/**
 * app/page.tsx
 * 
 * De homepage van Wish2Share. Dit is een Server Component.
 * Het rendert de verschillende landingspagina-secties en is geoptimaliseerd voor SEO en snelheid.
 */

// We importeren de sectie-componenten die we zo meteen gaan aanmaken.
import Hero from '@/components/landing/hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';

// Dit is nu een async Server Component. Geen "use client" meer!
export default async function HomePage() {
  return (
    <main className="flex flex-col items-center">
      {/* 
        Elke sectie is een eigen component. 
        Deze worden op de server gerenderd en als één geheel naar de client gestuurd.
      */}
      <Hero />
      <HowItWorks />
      <Features />
      {/* ... andere toekomstige secties ... */}
    </main>
  );
}