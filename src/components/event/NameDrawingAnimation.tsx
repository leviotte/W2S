/**
 * src/components/event/NameDrawingAnimation.tsx
 *
 * Volledig gecorrigeerd en verbeterd component.
 * FIX:
 * - 'use client' toegevoegd voor App Router compatibiliteit.
 * - Guard clauses toegevoegd om 'undefined' errors te voorkomen.
 * - Syntaxfouten in useCallback en button onClick hersteld.
 * - useEffect en useCallback dependencies geoptimaliseerd.
 */
'use client'; // BEST PRACTICE: Essentieel voor componenten met hooks.

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

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

  // FIX: Syntaxfout hersteld (triggerC -> triggerConfetti)
  const triggerConfetti = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const startNameDrawing = useCallback(() => {
    // FIX: Guard clause om de 'undefined' error te voorkomen.
    const availableNames = names.filter((n) => n !== currentName);
    if (availableNames.length === 0) {
      console.warn('[NameDrawing] Geen beschikbare namen om te trekken.');
      onClose(); // Sluit de modal als er niets te doen is.
      return;
    }

    setIsSpinning(true);
    setDrawnName(null);
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const delay = 50 + 450 * easeOut;

      if (elapsed < duration) {
        const nextIndex = Math.floor(Math.random() * availableNames.length);
        const nextName = availableNames[nextIndex]!; // Non-null assertion is nu veilig.
        setCurrentName(nextName);
        setTimeout(animate, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * availableNames.length);
        const finalName = availableNames[finalIndex]!; // Non-null assertion is nu veilig.
        setCurrentName(finalName);
        setDrawnName(finalName);
        setIsSpinning(false);
        onNameDrawn(finalName);
        triggerConfetti();
      }
    };

    animate();
  }, [names, currentName, onNameDrawn, triggerConfetti, onClose]); // BEST PRACTICE: Correcte dependencies

  useEffect(() => {
    if (isOpen && !drawnName) {
      startNameDrawing();
    }
  }, [isOpen, drawnName, startNameDrawing]); // BEST PRACTICE: Correcte dependencies

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-sm bg-warm-beige rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-warm-olive mb-4">
                {isSpinning ? 'Naam wordt getrokken...' : 'Jouw getrokken naam:'}
              </div>
              <motion.div
                animate={{ scale: isSpinning ? [1, 1.1, 1] : 1, opacity: isSpinning ? [1, 0.7, 1] : 1 }}
                transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
                className={`text-3xl font-bold text-cool-olive ${isSpinning ? 'blur-sm' : ''}`}
              >
                {currentName}
              </motion.div>
            </div>
          </div>

          {drawnName && !isSpinning && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">Gefeliciteerd! Jij trok {drawnName}.</p>
              {/* FIX: Syntaxfout in button hersteld ({onClose} -> onClick={onClose}) */}
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sluit
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}