"use client";

import { Gift, Users, CalendarPlus, Bell } from "lucide-react";

const features = [
  {
    name: "Beheer profielen",
    icon: Gift,
    sectionId: "drawing",
  },
  {
    name: "Organiseer evenementen",
    icon: Users,
    sectionId: "drawing",
  },
  {
    name: "Maak Wishlists",
    icon: CalendarPlus,
    sectionId: "events",
  },
  {
    name: "Volg Vrienden",
    icon: Bell,
    sectionId: "subscriptions",
  },
];

export default function Features() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <button
                key={feature.name}
                onClick={() => scrollToSection(feature.sectionId)}
                className="relative group cursor-pointer w-full text-left"
              >
                <div className="flex flex-col h-full p-6 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-warm-olive">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-warm-olive text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-warm-olive transition-colors">
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
