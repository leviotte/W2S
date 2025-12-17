/**
 * components/landing/features.tsx
 *
 * Feature kaarten met smooth scroll naar secties.
 * AANGEPAST OM DE OUDE LAYOUT TE EVENAREN.
 */
'use client';

import { Gift, Users, CalendarPlus, Share2 } from 'lucide-react';

const features = [
  {
    name: 'Beheer profielen',
    description: 'Creëer profielen voor jezelf, je gezin en beheer alles op één plek.',
    icon: Users,
    sectionId: 'profiles',
  },
  {
    name: 'Maak Wishlists',
    description: 'Voeg cadeaus toe van elke webshop en deel je wensen eenvoudig.',
    icon: Gift,
    sectionId: 'wishlists',
  },
  {
    name: 'Organiseer evenementen',
    description: 'Plan verjaardagen, feestdagen of Secret Santa, inclusief lootjes trekken.',
    icon: CalendarPlus,
    sectionId: 'events',
  },
  {
    name: 'Volg Vrienden',
    description: 'Blijf op de hoogte van de wensen van je vrienden en mis nooit een cadeautip.',
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
    <div className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-10">
          <div className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0">
            {features.map((feature) => (
              <button
                key={feature.name}
                onClick={() => scrollToSection(feature.sectionId)}
                className="group relative w-full cursor-pointer text-left"
              >
                <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-warm-olive hover:shadow-md">
                  <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-warm-olive text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium text-gray-900 transition-colors group-hover:text-warm-olive">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}