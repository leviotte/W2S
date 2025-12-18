// src/app/page.tsx
import Hero from '@/components/landing/hero';
import SearchButton from '@/components/shared/search-button'; // ✅ UPDATED IMPORT
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';

export const metadata = {
  title: 'Wish2Share - Deel je wensen, deel geluk',
  description: 'De perfecte site om evenementen te organiseren, cadeaus uit te wisselen en wishlists te maken. Maak cadeaus geven leuk en gemakkelijk!',
};

export default function HomePage() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <Hero />
          
          <div className="mt-8 flex justify-center">
            <SearchButton />
          </div>
        </div>
      </div> 
      
      <div className="mt-12">
        <HowItWorks />
      </div>

      <div className="mt-12">
        <Features />
      </div>
    </div>
  );
}