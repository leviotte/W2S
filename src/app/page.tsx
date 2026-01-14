// src/app/page.tsx
import Hero from '@/components/landing/hero';
import SearchButton from '@/components/shared/search-button';
import HowItWorks from '@/components/landing/HowItWorks';


export const metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'De perfecte site om evenementen te organiseren, cadeaus uit te wisselen en wishlists te maken. Maak cadeaus geven leuk en gemakkelijk!',
};

export default function HomePage() {
  return (
    <div>
      {/* ✅ EXACT zoals oude Home.tsx - geen extra padding! */}
      <div>
        <Hero />
        <SearchButton />
      </div>
      <HowItWorks />
      {/* <Features /> */}
    </div>
  );
}