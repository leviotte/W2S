'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Users } from 'lucide-react';
import { cn } from '@/lib/utils'; // Voorwaardelijke classNames, komt van Shadcn

const titles = [
  { text: 'Trek Lootjes', id: 1 },
  { text: 'Organiseer Events', id: 2 },
  { text: 'Maak WishLists', id: 3 },
  { text: 'Volg Vrienden', id: 4 },
];

export function HeroSection() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 2500); // Iets langere interval voor een rustiger effect

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="absolute inset-0 z-0 bg-repeat"
        style={{
          backgroundImage: `url('/pattern-bg.svg')`, // Zorg dat dit bestand in /public staat
          opacity: 0.1,
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            <div className="relative h-[4.5rem] overflow-hidden">
              {titles.map((title, index) => (
                <span
                  key={title.id}
                  className={cn(
                    'absolute inset-x-0 transition-all duration-500 ease-in-out',
                    {
                      'top-0 opacity-100': index === currentTitleIndex,
                      '-top-full opacity-0': index < currentTitleIndex,
                      'top-full opacity-0': index > currentTitleIndex,
                    }
                  )}
                >
                  <span
                    className={cn({
                      'text-green-600': index === 1 || index === 3,
                      'text-teal-600': !(index === 1 || index === 3),
                    })}
                  >
                    {title.text}
                  </span>
                </span>
              ))}
            </div>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
            De perfecte site om evenementen te organiseren, cadeaus uit te
            wisselen en wishlists te maken. Maak cadeaus geven leuk en
            gemakkelijk!
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-4 sm:flex-row md:mt-10">
            <Link
              href="/dashboard?tab=events&subTab=create"
              className="group h-32 w-full rounded-lg bg-gradient-to-r from-green-500 via-teal-500 to-green-500 p-0.5 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-background px-2">
                <Users className="mb-2 h-8 w-8 text-foreground" />
                <span className="text-md font-semibold text-foreground sm:text-lg">
                  Maak een Event
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  (Met of zonder lootjes)
                </span>
              </div>
            </Link>
            <Link
              href="/dashboard?tab=wishlists&subTab=create"
              className="group h-32 w-full rounded-lg bg-gradient-to-r from-green-500 via-teal-500 to-green-500 p-0.5 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-background px-2">
                <Gift className="mb-2 h-8 w-8 text-foreground" />
                <span className="text-md font-semibold text-foreground sm:text-lg">
                  Maak een Wishlist
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  (Voor jezelf of anderen)
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}