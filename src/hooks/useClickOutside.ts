/**
 * src/hooks/useClickOutside.ts
 * 
 * FINALE VERSIE: Nog robuuster. Accepteert nu een array van refs
 * met verschillende HTML element types (bv. knoppen en divs samen).
 * Dit lost de 'HTMLButtonElement is not assignable to HTMLDivElement' fout op.
 */
import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

// We gebruiken hier een meer algemeen type dat een array van refs voor elk soort HTMLElement toelaat.
type RefArray = RefObject<HTMLElement | null>[];

export const useClickOutside = (
  refs: RefArray,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      // Controleer of de klik buiten ALLE opgegeven elementen valt.
      const isOutside = refs.every(ref => {
        // De cruciale check: bestaat de ref.current en is de klik erbuiten?
        return ref.current && !ref.current.contains(event.target as Node);
      });

      if (isOutside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler]); // Effect opnieuw uitvoeren als refs of handler veranderen
};