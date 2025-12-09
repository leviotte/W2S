/**
 * src/components/event/NameDrawingAnimation.tsx
 *
 * GOLD STANDARD VERSIE 2.0: Volledig functioneel en afgestemd op de parent component.
 * FIX:
 * - Syntaxfouten in useCallback en button onClick hersteld.
 * - Variabelenamen ('triggerConfetti', 'animationEnd') gecorrigeerd.
 * - De prop 'onNameDrawn' hernoemd naar 'onDraw' om de type-error op te lossen.
 * - Prop-types geëxporteerd voor betere herbruikbaarheid.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

// BEST PRACTICE: Exporteer de props interface voor duidelijkheid en herbruikbaarheid.
export interface NameDrawingAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  names: string[];
  onDraw: (name: string) => void; // CRUCIALE FIX: Hernoemd van onNameDrawn naar onDraw
}

export default function NameDrawingAnimation({
  isOpen,
  onClose,
  names,
  onDraw, // CRUCIALE FIX: Hernoemd
}: NameDrawingAnimationProps) {
  const [currentName, setCurrentName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnName, setDrawnName] = useState<string | null>(null);

  // FIX: Syntaxfouten hersteld en functie hernoemd
  const triggerConfetti = useCallback(() => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  const startNameDrawing = useCallback(() => {
    const availableNames = names.filter((n) => n !== currentName);
    if (availableNames.length === 0) {
      console.warn('[NameDrawing] Geen beschikbare namen om te trekken.');
      onClose();
      return;
    }

    setIsSpinning(true);
    setDrawnName(null);
    const duration = 4000; // Iets korter voor een snellere ervaring
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const nextIndex = Math.floor(Math.random() * availableNames.length);
        setCurrentName(availableNames[nextIndex]!);
        setTimeout(animate, 100); // Vaste snelle interval voor de 'shuffle'
      } else {
        const finalIndex = Math.floor(Math.random() * availableNames.length);
        const finalName = availableNames[finalIndex]!;
        setCurrentName(finalName);
        setDrawnName(finalName);
        setIsSpinning(false);
        onDraw(finalName); // CRUCIALE FIX: Hernoemd
        triggerConfetti();
      }
    };

    animate();
  }, [names, currentName, onDraw, triggerConfetti, onClose]);

  useEffect(() => {
    if (isOpen && !isSpinning && !drawnName) {
      startNameDrawing();
    }
  }, [isOpen, isSpinning, drawnName, startNameDrawing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-card shadow-2xl border"
      >
        <div className="p-6 text-center">
          <div className="py-8">
              <p className="mb-4 text-lg font-medium text-foreground">
                {isSpinning ? 'Lootje wordt getrokken...' : 'Gefeliciteerd! Jij koopt voor:'}
              </p>
              <div className="relative h-20 flex items-center justify-center">
                {isSpinning ? (
                    <motion.div
                        key={currentName}
                        initial={{ y: 20, opacity: 0}}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.1 }}
                        className="text-4xl font-bold text-primary truncate"
                    >
                        {currentName}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="text-5xl font-bold text-primary"
                    >
                        {drawnName}
                    </motion.div>
                )}
              </div>
          </div>
          
          {!isSpinning && drawnName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* FIX: Syntaxfout in button hersteld en onClick toegevoegd */}
              <button
                onClick={onClose}
                className="mt-4 w-full rounded-md bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sluiten
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}