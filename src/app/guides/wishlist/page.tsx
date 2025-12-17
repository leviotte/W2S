// src/app/guides/wishlist/page.tsx
import Image from "next/image";
import { Gift, Share2, Bell, List } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Gift,
    title: "Stap 1: Maak een nieuwe wishlist aan",
    description:
      "Klik op de knop 'Nieuwe wishlist' op je dashboard. Geef je lijst een duidelijke naam, zoals 'Verjaardag 2025' of 'Kerstmis'.",
    image:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    icon: List,
    title: "Stap 2: Voeg items toe",
    description:
      "Voeg items toe aan je lijst met titel, beschrijving, link naar een online winkel en eventueel een prijs. Hoe meer details, hoe makkelijker voor anderen.",
    image:
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    icon: Share2,
    title: "Stap 3: Deel je lijst",
    description:
      "Deel je verlanglijst eenvoudig met familie en vrienden via de deelknop. Ze kunnen je lijst bekijken zonder account.",
    image:
      "https://images.unsplash.com/photo-1522543558187-768b6df7c25c?w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    icon: Bell,
    title: "Stap 4: Beheer je lijst",
    description:
      "Je kunt je lijst altijd bewerken, items toevoegen of verwijderen. Anderen kunnen jouw lijst volgen om op de hoogte te blijven.",
    image:
      "https://images.unsplash.com/photo-1586892478025-2b5472316ea4?w=1200&auto=format&fit=crop",
  },
];

export default function WishlistGuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-center text-4xl font-bold text-gray-900 mb-16">
        Hoe maak je een verlanglijst aan?
      </h1>

      <div className="space-y-24">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <section
              key={step.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                index % 2 !== 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 !== 0 ? "md:order-2" : ""}>
                <div className="flex items-center gap-4 mb-4">
                  <Icon className="h-12 w-12 text-amber-500" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {step.title}
                  </h2>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className={index % 2 !== 0 ? "md:order-1" : ""}>
                <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
