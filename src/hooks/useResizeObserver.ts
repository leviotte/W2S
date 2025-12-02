import { useEffect, useRef } from 'react';

export const useResizeObserver = (callback: () => void) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => callback());
    observer.observe(element);

    return () => observer.disconnect();
  }, [callback]);

  return elementRef;
};
