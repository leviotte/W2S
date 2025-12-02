import { useState, useEffect, useCallback } from 'react';

interface UseModalProps {
  onClose?: () => void;
  onAfterClose?: () => void;
}

export const useModal = ({ onClose, onAfterClose }: UseModalProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    if (onAfterClose) setTimeout(onAfterClose, 200);
  }, [onClose, onAfterClose]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  return { isOpen, handleOpen, handleClose, handleOverlayClick };
};
