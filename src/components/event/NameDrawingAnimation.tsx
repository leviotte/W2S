// src/components/event/NameDrawingAnimation.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface NameDrawingAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  onNameDrawn: (name: string) => void;
}

export default function NameDrawingAnimation({
  isOpen,
  onClose,
  names,
  onNameDrawn,
}: NameDrawingAnimationProps) {
  const [currentName, setCurrentName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnName, setDrawnName] = useState<string | null>(null);

  const triggerConfetti = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  useEffect(() => {
    if (isOpen && !drawnName) {
      startNameDrawing();
    }
  }, [isOpen]);

  const startNameDrawing = () => {
    setIsSpinning(true);
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    let currentIndex = 0;
    const availableNames = [...names]; // Copy array

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easeOutQuart for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const delay = 50 + 450 * easeOut; // 50ms to 500ms

      if (elapsed < duration) {
        currentIndex = (currentIndex + 1) % availableNames.length;
        setCurrentName(availableNames[currentIndex]);
        setTimeout(animate, delay);
      } else {
        // Select final name randomly from available names
        const finalIndex = Math.floor(Math.random() * availableNames.length);
        const finalName = availableNames[finalIndex];
        setCurrentName(finalName);
        setDrawnName(finalName);
        setIsSpinning(false);
        onNameDrawn(finalName);
        triggerConfetti();
      }
    };

    animate();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl"
    >
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-sm bg-warm-beige rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-warm-olive mb-4">
              {isSpinning ? 'Naam wordt getrokken...' : 'Jouw getrokken naam:'}
            </div>
            <motion.div
              animate={{
                scale: isSpinning ? [1, 1.1, 1] : 1,
                opacity: isSpinning ? [1, 0.7, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: isSpinning ? Infinity : 0,
              }}
              className={`text-3xl font-bold text-cool-olive transition-all duration-300 ${
                isSpinning ? 'blur-sm' : 'blur-none'
              }`}
            >
              {currentName || '...'}
            </motion.div>
          </div>
        </div>

        {drawnName && !isSpinning && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              Gefeliciteerd! Jij trok {drawnName}.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive transition-colors"
            >
              Sluit
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}