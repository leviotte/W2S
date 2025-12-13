'use client';

/**
 * components/landing/hero-title.tsx
 *
 * Roterende hero titel met animatie
 */

import { useState, useEffect } from 'react';

const titles = [
  { text: 'Trek Lootjes', id: 1 },
  { text: 'Organiseer Events', id: 2 },
  { text: 'Maak WishLists', id: 3 },
  { text: 'Volg Vrienden', id: 4 },
];

export default function HeroTitle() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
      <div className="relative h-[4.5rem] overflow-hidden sm:h-[3.5rem] md:h-[4.5rem]">
        {titles.map((title, index) => {
          const isActive = index === currentTitleIndex;
          return (
            <span
              key={title.id}
              className={`absolute left-0 w-full transition-all duration-500 ${
                isActive ? 'top-0 opacity-100' : '-top-full opacity-0'
              }`}
            >
              <span
                className={`block ${
                  index === 1 || index === 3
                    ? 'text-warm-olive'
                    : 'text-cool-olive'
                }`}
              >
                {title.text}
              </span>
            </span>
          );
        })}
      </div>
    </h1>
  );
}