/**
 * app/page.tsx
 * 
 * Homepage - De complete landing page van Wish2Share
 */

import Hero from '@/components/landing/hero';
import SearchButton from '@/components/layout/SearchButton';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';

export const metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'De perfecte site om evenementen te organiseren, cadeaus uit te wisselen en wishlists te maken. Maak cadeaus geven leuk en gemakkelijk!',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchButton />
      <HowItWorks />
      <Features />
    </>
  );
}