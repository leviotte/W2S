import { useEffect, RefObject } from 'react';

export function useClickOutside(refs: RefObject<HTMLElement>[], handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!refs.some(ref => ref.current?.contains(event.target as Node))) {
        handler();
      }
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [refs, handler]);
}
