/**
 * components/landing/features.tsx
 * 
 * Feature kaarten met smooth scroll naar secties
 */
'use client';

import { Gift, Users, CalendarPlus, Share2 } from 'lucide-react';

const features = [
  {
    name: 'Beheer profielen',
    icon: Users,
    sectionId: 'profiles',
  },
  {
    name: 'Maak Wishlists',
    icon: Gift,
    sectionId: 'wishlists',
  },
  {
    name: 'Organiseer evenementen',
    icon: CalendarPlus,
    sectionId: 'events',
  },
  {
    name: 'Volg Vrienden',
    icon: Share2,
    sectionId: 'following',
  },
];

export default function Features() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <button
              key={feature.name}
              onClick={() => scrollToSection(feature.sectionId)}
              className="relative group cursor-pointer w-full text-left"
            >
              <div className="flex flex-col items-center justify-center h-full p-8 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-warm-olive hover:-translate-y-1">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-warm-olive text-white mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-warm-olive transition-colors text-center">
                  {feature.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}