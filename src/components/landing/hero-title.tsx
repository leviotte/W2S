/**
 * components/landing/hero-title.tsx
 *
 * Client Component die enkel verantwoordelijk is voor de animatie
 * van de roterende H1-titels op de landingspagina.
 */
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TITLES = [
  { text: "Trek Lootjes" },
  { text: "Organiseer Events" },
  { text: "Maak WishLists" },
  { text: "Volg Vrienden" },
];

export default function HeroTitle() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % TITLES.length);
    }, 2500); // Iets tragere interval voor een rustiger effect

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
      <div className="relative h-14 overflow-hidden md:h-16">
        {TITLES.map((title, index) => (
          <span
            key={title.text}
            className={cn(
              'absolute inset-x-0 transition-all duration-500 ease-in-out',
              index === currentTitleIndex
                ? 'top-0 opacity-100'
                : 'top-full opacity-0'
            )}
            // Zorgt ervoor dat de volgende slide van onderen komt
            style={{ transform: index === currentTitleIndex ? 'translateY(0)' : 'translateY(100%)' }}
          >
            <span className="block text-cool-olive">{title.text}</span>
          </span>
        ))}
      </div>
    </h1>
  );
}