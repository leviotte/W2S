import { useEffect, useRef } from 'react';

interface ScrollOptions {
  behavior?: ScrollBehavior;
  threshold?: number;
}

export const useScrollToBottom = (dependencies: any[], options: ScrollOptions = { behavior: 'smooth', threshold: 100 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight <= (options.threshold || 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [options.threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isNearBottomRef.current) return;
    container.scrollTo({ top: container.scrollHeight, behavior: options.behavior });
  }, [...dependencies]);

  return containerRef;
};
