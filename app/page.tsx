import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
// import { FeaturesSection } from '@/components/landing/FeaturesSection';

// Gold-standard SEO met de Metadata API
export const metadata: Metadata = {
  title: 'Wish2Share | Eenvoudig en Samen Wensenlijstjes Delen',
  description:
    'Maak, deel en beheer online wensenlijstjes voor verjaardagen, feestdagen en meer. Nodig vrienden en familie uit en voorkom dubbele cadeaus. Start vandaag nog gratis!',
  openGraph: {
    title: 'Wish2Share | Eenvoudig en Samen Wensenlijstjes Delen',
    description: 'Deelbare online wensenlijstjes voor elke gelegenheid.',
    images: ['/opengraph/default-og.png'], // Zorg dat dit bestand in /public/opengraph/ staat
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center">
      <HeroSection />
      <HowItWorksSection />
      {/* <FeaturesSection /> */}
      {/* De Features-sectie staat klaar om later toegevoegd te worden. */}
    </main>
  );
}