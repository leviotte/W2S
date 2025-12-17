/**
 * app/page.tsx
 *
 * Homepage - De complete landing page van Wish2Share
 * VERBETERDE VERSIE
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
    // We gebruiken een container die de volledige breedte inneemt.
    // De 'overflow-hidden' is een goede gewoonte om onverwachte scrollbars te vermijden.
    <div className="relative w-full overflow-hidden">
      
      {/* 
        Container voor de Hero sectie.
        - 'max-w-7xl': Maximale breedte voor de content, net als in je oude Hero.
        - 'mx-auto': Centreert de container horizontaal.
        - 'px-4 sm:px-6 lg:px-8': Zorgt voor de juiste padding op verschillende schermgroottes.
        - 'py-8': Geeft verticale ruimte boven en onder de content.
        - 'relative z-10': Zorgt ervoor dat deze content boven eventuele achtergrondelementen ligt.
      */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/*
          De sleutel tot centrering! 
          Deze div zorgt ervoor dat de Hero-content, de SearchButton en de andere secties
          netjes in het midden uitgelijnd worden.
        */}
        <div className="text-center">
          <Hero />
          
          {/* 
            Container specifiek voor de zoekknop om deze correct te positioneren.
            - 'mt-8': Voegt extra ruimte toe boven de zoekknop.
            - 'flex justify-center': Centreert de knop binnen de container.
          */}
          <div className="mt-8 flex justify-center">
            <SearchButton />
          </div>
        </div>

      </div> 
      
      {/* De andere secties kunnen hieronder geplaatst worden, 
          eventueel in hun eigen 'max-w-7xl mx-auto' containers 
          voor een consistente breedte. */}
      
      <div className="mt-12"> {/* Voegt wat extra ruimte toe boven "HowItWorks" */}
        <HowItWorks />
      </div>

      <div className="mt-12"> {/* En ook wat ruimte boven "Features" */}
        <Features />
      </div>
    </div>
  );
}