import { useCallback, useRef } from 'react';

export const useLongPress = (callback: () => void, duration = 500) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPressed = useRef(false);

  const start = useCallback(() => {
    isPressed.current = true;
    timeoutRef.current = setTimeout(() => {
      if (isPressed.current) callback();
    }, duration);
  }, [callback, duration]);

  const cancel = useCallback(() => {
    isPressed.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel
  };
};
